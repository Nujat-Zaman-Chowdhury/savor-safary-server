const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

//middleware
const corsOptions = {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      '',
    ],
    credentials:true,
    optionsSuccessStatus:200,
}
app.use(cors(corsOptions))
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eaermrq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    
    const foodsCollection = client.db('sovorSafari').collection('foods');
    const purchasesCollection = client.db('sovorSafari').collection('purchases');
    const galleryCollection = client.db('sovorSafari').collection('galleries');

    //add food
    app.post('/foods',async(req,res)=>{
        const foodData = req.body;
        const result = await foodsCollection.insertOne(foodData)
        res.send(result)
    })

    //get added food
    app.get('/foods',async(req,res)=>{
        const result = await foodsCollection.find().toArray();
        res.send(result)
    })

    //get a single Food item
    app.get('/food/:id',async(req,res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await foodsCollection.findOne(query)
        res.send(result)
    })

    //get food items by user 
    app.get('/foods/:email',async(req,res)=>{
      const email = req.params.email;
      const query = {email: email}
      const result = await foodsCollection.find(query).toArray();
      res.send(result)
    })

    //update foodItem
    app.put('/food/:id',async(req,res)=>{
      const id = req.params.id;
      console.log(id);
      const foodData = req.body;
      const query = {_id: new ObjectId(id)}
      const options = {upsert:true}
      const updateDoc = {
        $set:{
          ...foodData,
        }
      }
      const result = await foodsCollection.updateOne(query,updateDoc,options)
      console.log(result);
      res.send(result)
    })


    //post purchase item
    app.post('/purchase-food-items',async(req,res)=>{
      const foodData = req.body;
      const result = await purchasesCollection.insertOne(foodData)
      res.send(result)
  })

  //get  purchased food items
  app.get('/purchase-food-items',async(req,res)=>{
    const result = await purchasesCollection.find().toArray();
    res.send(result)
  })

  //get purchased item by email
  app.get('/purchase-food-items/:email',async(req,res)=>{
    const email = req.params.email;
    const query = {email: email}
    const result = await purchasesCollection.find(query).toArray();
    console.log(result);
    res.send(result)
  })



  //get all foods for pagination
  app.get('/all-foods',async(req,res)=>{
    const page = parseFloat(req.query.page) - 1;
      const size = parseFloat(req.query.size);
    const result = await foodsCollection.find().skip(page * size).limit(size).toArray();
    res.send(result)
  })

  //get all foods data count from db
  app.get('/foods-count',async(req,res)=>{
    const count = await foodsCollection.countDocuments();
    console.log(count);
    res.send({count})
  })


  //gallery page 
  //post user feedback in gallery section
  app.post('/galleries',async(req,res)=>{
    const galleryData = req.body;
    const result = await galleryCollection.insertOne(galleryData)
    res.send(result)
})

  //get user feedback
  app.get('/galleries',async(req,res)=>{
    const result = await galleryCollection.find().toArray()
    res.send(result);

  })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error

  }
}
run().catch(console.dir);



app.get('/',(req,res)=>{
    res.send("SavorSafari server is running")
})

app.listen(port,()=>{
    console.log(`Cooking on port:${port}`);
})