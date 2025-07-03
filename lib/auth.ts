import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoClient, MongoClientOptions } from "mongodb";
import { compare } from "bcrypt";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

// Connect to MongoDB with improved options
const uri = process.env.MONGODB_URI as string;
const options: MongoClientOptions = {
  ssl: true,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        let client = null;
        try {
          // Connect to the database with improved options
          client = new MongoClient(uri, options);
          await client.connect();
          const db = client.db();
          const usersCollection = db.collection("users");
          
          // Find user by email
          const user = await usersCollection.findOne({ email: credentials.email });
          
          if (!user) {
            throw new Error("No user found with this email");
          }

          // Compare password
          const passwordMatch = await compare(credentials.password, user.password);
          
          if (!passwordMatch) {
            throw new Error("Incorrect password");
          }

          // Return user without password
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || "",
            image: user.image || "",
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          throw new Error(error.message || "Authentication failed");
        } finally {
          // Close the connection
          if (client) await client.close();
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
    error: "/signin", // Add this to handle errors
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development", // Enable debug mode in development
  secret: process.env.AUTH_SECRET,
};

export const getSession = () => getServerSession(authOptions); 