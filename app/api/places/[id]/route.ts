import { NextResponse, NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';

const COLLECTION_NAME = 'places';

//ts
function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function getIdFromRequest(request: NextRequest) {
  //get last seg
  return request.nextUrl.pathname.split('/').pop() || '';
}

//getting
export async function GET(request: NextRequest) {
  const id = getIdFromRequest(request);
  const _id = toObjectId(id);
  if (!_id) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
  }
  try {
    const db = await getDb();
    const place = await db.collection(COLLECTION_NAME).findOne({ _id });
    if (!place) {
      return NextResponse.json({ success: false, error: 'Place not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, place });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

//putting
export async function PUT(request: NextRequest) {
  const id = getIdFromRequest(request);
  const _id = toObjectId(id);
  if (!_id) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
  }
  try {
    const body = await request.json();
    const { name, latitude, longitude, images, phone, openHours, openDays } = body;
    if (!name || latitude == null || longitude == null || !images || !phone) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }
    const db = await getDb();
    const result = await db.collection(COLLECTION_NAME).updateOne(
      { _id },
      { $set: { name, latitude, longitude, images, phone, openHours, openDays } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Place not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

//delete
export async function DELETE(request: NextRequest) {
  const id = getIdFromRequest(request);
  const _id = toObjectId(id);
  if (!_id) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
  }
  try {
    const db = await getDb();
    const result = await db.collection(COLLECTION_NAME).deleteOne({ _id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Place not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
