import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const COLLECTION_NAME = 'places';

//getting placesfrom db
export async function GET() {
  try {
    const db = await getDb();
    const places = await db.collection(COLLECTION_NAME).find({}).toArray();
    return NextResponse.json({ success: true, places });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

//posting to db
export async function POST(request: Request) {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { name, latitude, longitude, phone, openHours, openDays } = body;
    const images = body.images || ["/assets/placeholder.jpg"]; // Handle multiple images with default
    
    if (!name || latitude == null || longitude == null || !phone) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }
    
    const db = await getDb();
    const result = await db.collection(COLLECTION_NAME).insertOne({ 
      name, 
      latitude, 
      longitude, 
      images, // Store array of images
      phone,
      openHours: openHours || "Not Known",
      openDays: openDays || "Not Known",
      createdBy: session.user.email || 'anonymous',
      createdAt: new Date()
    });
    return NextResponse.json({ success: true, insertedId: result.insertedId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
