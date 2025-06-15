const express = require('express')
const cors = require('cors')
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
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
        const recommendationsCollection = database.collection("recommendations");

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



  // get 6 data
  app.get('/recent-queries', async(req,res)=>{
    try{
      const recentQueries=await queriesCollection
      .find({})
      .sort({timestamp:-1})
      .limit(6)
      .toArray();

      res.status(200).send(recentQueries);
    }catch(error){
      console.error('Error fetching:', error);
      res.status(500).send({success:false, message: 'Failed to fetch'});
    }
  });


  // get top 3 recommended queries

  app.get('/top-recommended-queries',async(req,res)=>{
    try{
      const topQueries = await queriesCollection
      .find({})
        .sort({recommendationCount:-1})
        .limit(3)
        .toArray();

      res.status(200).send(topQueries);
    }catch(error){
      console.error('Error fetching:',error);
      res.status(500).send({success:false, message:'Failed to fetch' });
    }
  });


  // top contributors

  app.get('/top-contributors', async (req,res)=>{
    try{
      const pipeline=[
        {
          $group:{
            _id:"$userEmail",
            userName:{$first:"$userName"},
            userImage:{$first:"$userImage"},
            queryCount:{$sum:1}
          }
        },
        {$sort:{queryCount:-1}},
        {$limit:5}
      ];

      const result=await queriesCollection.aggregate(pipeline).toArray();
      res.status(200).send(result);
    }catch(error){
      console.error('Error fetching:',error);
      res.status(500).send({success:false,message:'Failed to fetch'});
    }
  })


  // get queries of a specific user
  app.get('/my-queries',async(req,res)=>{
    try{
      const userEmail=req.query.email;
      if(!userEmail){
        return res.status(400).send({success:false,message:"Email is required"});

      }
      const userQueries = await queriesCollection
      .find({userEmail})
        .sort({timestamp: -1})
        .toArray();
      
        res.status(200).send(userQueries);

    }catch(error){
      console.error('Error fetching:',error);
      res.status(500).send({success:false, message:"Failed to fetch queries"})
    }
  });

  // delete queries

  app.delete('/query/:id',async(req,res)=>{
    try{
      const id= req.params.id;
      const result = await queriesCollection.deleteOne({_id:new ObjectId(id)});

      if(result.deletedCount>0){
        res.status(200).send({success:true, message:"Query deleted"});
      }else{
        res.status(404).send({success:false, message:"Query not found"});
      }
    }catch(error){
      console.error('Error deleting query:', error);
      res.status(500).send({success:false, message:'Failed to delete query'});
    }
  });

  // update query
  app.put('/query/:id',async(req,res)=>{
    try{
      const id=req.params.id;
      const updatedData = req.body;

      const result = await queriesCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set: updatedData}
      );

       if(result.modifiedCount>0){
        res.status(200).send({success:true, message:"Query updated"});
      }else{
        res.status(404).send({success:false, message:"No changes"});
      }
    }catch(error){
      console.error('Error updating query:', error);
      res.status(500).send({success:false, message:'Failed to update query'});
    }
  });

  // get all queries
  app.get('/all-queries',async(req,res)=>{
    try{
      const allQueries=await queriesCollection
      .find({})
      .sort({timestamp:-1})
      .toArray();

      res.status(200).send(allQueries);
    }catch(error){
      console.error('Error fetching all queries:',error)
      res.status(500).send({success:false, message: 'Failed to fetch'})

    }
  })


  // get query by id

  app.get('/query/:id',async(req,res)=>{
    try{
      const id=req.params.id;
      const query = await queriesCollection.findOne({_id: new ObjectId(id)});
      if(!query) return res.status(404).send({success:false, message:'Query not found'});
      res.send(query);
    }catch(error){
      console.error(error);
      res.status(500).send({success:false, message:"Error fetching query"});
    }
  });


  // post recommendations 
  app.post('/add-recommendation',async(req,res)=>{
    try{
      const recommendation=req.body;
      const result = await recommendationsCollection.insertOne(recommendation);
      res.status(201).send({success:true, insertedId:result.insertedId});

    }catch(error){
      console.error(error);
      res.status(500).send({success:false, message:'Failed to add'});
    }
  });

  // increment recommendationCount
  app.patch('/query-recommendation-count/:id', async(req,res)=>{
    try{
      const id = req.params.id;
      const result = await queriesCollection.updateOne(
        {_id:new ObjectId(id)},
        {$inc: {recommendationCount:1}}
      );
      res.send(result);

    }catch(error){
      console.error(error);
      res.status(500).send({success:false, message:'Failed to increment'});
    }
  });

//  Get Recommendations for a Query
  app.get('/recommendations',async(req,res)=>{
    try{
      const queryId=req.query.queryId;
      const recommendations = await recommendationsCollection
      .find({queryId})
      .sort({timestamp:-1})
      .toArray();

      res.send(recommendations);
    }catch(error){
      console.error(error);
      res.status(500).send({success:false, message:'Failed to fetch'});
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