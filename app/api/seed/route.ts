import { NextResponse } from "next/server";
import { MongoClient, MongoClientOptions } from "mongodb";
import { hash } from "bcrypt";

// Connect to MongoDB with improved options
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
    
    // Check if the test user already exists
    const existingUser = await usersCollection.findOne({ email: "admin@example.com" });
    
    if (existingUser) {
      return NextResponse.json({
        message: "Test user already exists",
        email: "admin@example.com",
        password: "password123"
      });
    }
    
    // Create a test user
    const hashedPassword = await hash("password123", 10);
    
    await usersCollection.insertOne({
      name: "Test Admin",
      email: "admin@example.com",
      password: hashedPassword,
      createdAt: new Date()
    });
    
    return NextResponse.json({
      message: "Test user created successfully",
      email: "admin@example.com",
      password: "password123"
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to seed database" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
} 