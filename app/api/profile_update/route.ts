import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

type UserUpdateData = {
  name?: string;
  image?: string | null;
  telephone?: string;
  email?: string;
  emailVerified?: string;
  password?: string;
  updatedAt?: string;
};

export async function POST(req: Request) {
  try {
    if (req.method !== 'POST') {
      return new NextResponse(
        JSON.stringify({
          message: 'Only POST method is accepted',
          status: 405,
        }),
        { status: 405 }
      );
    }

    const data = await req.json();
    const { name, id, image, email, phone, password } = data;

    if (!id) {
      return new NextResponse(
        JSON.stringify({
          message: 'User ID is required',
          status: 400,
        }),
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('screen-handler');

    let query: Record<string, unknown> = { _id: id };
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
    }

    const userDoc = await db.collection('users').findOne(query);

    if (!userDoc) {
      return new NextResponse(
        JSON.stringify({
          message: 'No such user exists',
          status: 422,
        }),
        { status: 422 }
      );
    }

    const currentUserData = userDoc;

    if (email && email !== currentUserData.email) {
      const existingUserDoc = await db.collection('users').findOne({ email });

      if (existingUserDoc && existingUserDoc._id.toString() !== id) {
        return new NextResponse(
          JSON.stringify({
            message: 'Email is already taken by another user',
            status: 422,
          }),
          { status: 422 }
        );
      }
    }

    const updateObj: UserUpdateData = {};

    if (name && currentUserData.name !== name) {
      updateObj.name = name;
    }

    if (image !== undefined && currentUserData.image !== image) {
      updateObj.image = image;
    }

    if (phone !== undefined && currentUserData.telephone !== phone) {
      updateObj.telephone = phone;
    }

    if (email && currentUserData.email !== email) {
      updateObj.email = email;
      const timestamp = Date.now();
      const dateObject = new Date(timestamp);
      const date = dateObject.getDate();
      const month = dateObject.getMonth() + 1;
      const year = dateObject.getFullYear();
      const hour = dateObject.getHours();
      const minute = dateObject.getMinutes();
      const second = dateObject.getSeconds();
      updateObj.emailVerified = `${year}-${month}-${date} ${hour}:${minute}:${second}`;
    }

    if (password && password.length > 0) {
      const salt = parseInt(process.env.BCRYPT_SALT || '12', 10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateObj.password = hashedPassword;
    }

    updateObj.updatedAt = new Date().toISOString();

    if (Object.keys(updateObj).length > 0) {
      await db.collection('users').updateOne(query, { $set: updateObj });
    }

    return new NextResponse(
      JSON.stringify({
        message: 'Profile updated successfully',
        status: 200,
        updated: Object.keys(updateObj),
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return new NextResponse(
      JSON.stringify({
        message: 'Internal server error',
        status: 500,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
}
