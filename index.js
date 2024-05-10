const express = require('express');
const cors = require('cors');
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


app.get('/',(req,res)=>{
    res.send("SavorSafari server is running")
})

app.listen(port,()=>{
    console.log(`Cooking on port:${port}`);
})