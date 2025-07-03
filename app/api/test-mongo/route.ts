import { NextResponse } from "next/server";
import { MongoClient, MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const options: MongoClientOptions = {
  ssl: true,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
};
const client = new MongoClient(uri, options);

export async function GET() {
  try {
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection("users");
    
    // Count users
    const userCount = await usersCollection.countDocuments();
    
    // Get a sample user (w/o password)
    const sampleUser = await usersCollection.findOne(
      {},
      { projection: { password: 0 } }
    );
    
    return NextResponse.json({
      status: "Connected successfully to MongoDB",
      userCount,
      sampleUser: sampleUser ? "User exists" : "No users found",
      dbInfo: {
        dbName: db.databaseName,
        collections: await db.listCollections().toArray().then(cols => cols.map(c => c.name))
      }
    });
  } catch (error: any) {
    console.error("MongoDB connection error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect to MongoDB" },
      { status: 500 }
    );
  } finally {
    // Close the connection
    await client.close();
  }
} 