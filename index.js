const express = require('express')
const cors = require('cors')
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nutvrzq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();

     const database = client.db("propick");
        const queriesCollection = database.collection("queries");

    app.post('/add-query',async(req,res)=>{
      try{
       

        const queryData=req.body;

        // add timestamp
        queryData.timestamp=new Date().toISOString();
        queryData.recommendationCount=0;

        const result=await queriesCollection.insertOne(queryData);

        res.status(201).send({success:true, insertedId:result.insertedId});

       } catch(error){
          console.error('Error adding:',error);
          res.status(500).send({success:false,message:'Failed to add.'});
       }
    });







    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch((err) => {
  console.error('MongoDB error:', err);
});



app.get('/',(req,res)=>{
    res.send('Propick Code Cooking')
})

app.listen(port, ()=>{
    console.log(`Propick Code server is running on port ${port}`)
})