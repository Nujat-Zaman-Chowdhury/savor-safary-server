const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
const corsOptions = {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://assignment-11-21ecc.web.app',
      'https://assignment-11-21ecc.firebaseapp.com'
    ],
    credentials:true,
    optionsSuccessStatus:200,
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

// verify jwt middleware
const verifyToken = (req,res,next)=>{
  const token = req.cookies?.token
  if(!token){
    return res.status(401).send({message:'Unauthorized access'})
  }
  if(token){
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
      if(err){
        return res.status(401).send({message:'Unauthorized access'})
      }
      console.log(decoded);
      req.user = decoded
      next();
    })
  }


}


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

    //jwt
    app.post('/jwt',async(req,res)=>{
      const email = req.body;
      const token = jwt.sign(email,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'7d'})
      res
      .cookie('token',token,{
        httpOnly:true,
        secure: process.env.NODE_ENV ==='production',
        sameSite: process.env.NODE_ENV=== 'production'? 'none': 'strict'
      })
      .send({success:true})
    })

    //clear token on logout
    app.get('/logout',(req,res)=>{
      res
      .clearCookie('token',{
        httpOnly:true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production'? 'none' : 'strict',
        maxAge:0,
      })
      .send({success:true})
    })

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

    //delete my added food item
    app.delete('/food/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await foodsCollection.deleteOne(query)
      res.send(result)
      
    })


    //post purchase item
    app.post('/purchase-food-items',async(req,res)=>{
      const foodData = req.body;
      const purchasedQuantity = foodData.quantity;
      const result = await purchasesCollection.insertOne(foodData)

      const query = {
        food_name: foodData.food_name
      }

      const updateDoc = {
        $inc: { 
          purchase_count: 1, 
          quantity: -purchasedQuantity 
      }
      }
      const updatePurchaseCount = await foodsCollection.updateOne(query,updateDoc)
      console.log(updatePurchaseCount);
      res.send(result)
  })

  //get  purchased food items
  app.get('/purchase-food-items',async(req,res)=>{
    const result = await purchasesCollection.find().toArray();
    res.send(result)
  })

  
  //delete  purchased food items by id
  app.delete('/purchase-food-items/:id',async(req,res)=>{
    const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await purchasesCollection.deleteOne(query)
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
      const search = req.query.search;
      console.log(search);
      let query = {
        food_name:{
          $regex: search, $options: 'i' 
        }
      }
      console.log(query);
    const result = await foodsCollection.find(query).skip(page * size).limit(size).toArray();
    res.send(result)
  })

  //get all foods data count from db
  app.get('/foods-count',async(req,res)=>{
    const search = req.query.search;
    let query = {
      food_name:{
        $regex:search, $options: 'i' 
      }
    }
    const count = await foodsCollection.countDocuments(query);
    console.log(count);
    res.send({count})
  })

  //get top purchased foods
  app.get('/top-purchased-foods',async(req,res)=>{
    const topPurchasedFoods =await  foodsCollection.find().sort({ purchase_count: -1 }).limit(6).toArray()
    console.log(topPurchasedFoods);
    res.send(topPurchasedFoods)
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