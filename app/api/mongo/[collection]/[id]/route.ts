import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  try {
    const { collection: collectionName, id } = await params;
    const client = await clientPromise;
    const db = client.db('screen-handler');
    const collection = db.collection(collectionName);

    // Try to find by _id if it's a valid ObjectId, otherwise find by string id
    let query: Record<string, unknown> = { _id: id };
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
    }

    const document = await collection.findOne(query);

    if (!document) {
      return NextResponse.json({ document: null }, { status: 200 });
    }

    return NextResponse.json({ document });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  try {
    const { collection: collectionName, id } = await params;
    const client = await clientPromise;
    const db = client.db('screen-handler');
    const collection = db.collection(collectionName);

    const body = await request.json();

    let query: Record<string, unknown> = { _id: id };
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
    }

    const updateQuery: Record<string, Record<string, unknown>> = { $set: {}, $push: {}, $pull: {} };

    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      if (value && typeof value === 'object' && '_op' in value) {
        const op = (value as { _op: string })._op;
        const opValue = (value as any).value;
        if (op === 'arrayUnion') {
          updateQuery.$push[key] = opValue;
        } else if (op === 'arrayRemove') {
          updateQuery.$pull[key] = opValue;
        }
      } else {
        updateQuery.$set[key] = value;
      }
    }

    if (Object.keys(updateQuery.$set).length === 0) delete updateQuery.$set;
    if (Object.keys(updateQuery.$push).length === 0) delete updateQuery.$push;
    if (Object.keys(updateQuery.$pull).length === 0) delete updateQuery.$pull;

    const result = await collection.updateOne(query, updateQuery, { upsert: true });

    return NextResponse.json({ success: true, result });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  try {
    const { collection: collectionName, id } = await params;
    const client = await clientPromise;
    const db = client.db('screen-handler');
    const collection = db.collection(collectionName);

    let query: Record<string, unknown> = { _id: id };
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
    }

    const result = await collection.deleteOne(query);

    return NextResponse.json({ success: true, result });
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
