// checkMongoConnection.js

const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;

async function checkMongoConnection() {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    // Attempt to connect to MongoDB
    await client.connect();
    console.log("MongoDB is connected properly!");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  } finally {
    // Ensure that the client will close when you finish/error out
    await client.close();
  }
}

checkMongoConnection();
