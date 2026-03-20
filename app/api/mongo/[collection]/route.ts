import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const { collection: collectionName } = await params;
    const client = await clientPromise;
    const db = client.db('screen-handler');
    const collection = db.collection(collectionName);

    const documents = await collection.find({}).toArray();

    return NextResponse.json({ documents });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const { collection: collectionName } = await params;
    const client = await clientPromise;
    const db = client.db('screen-handler');
    const collection = db.collection(collectionName);

    const body = await request.json();
    const result = await collection.insertOne(body);

    return NextResponse.json({ success: true, result });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
