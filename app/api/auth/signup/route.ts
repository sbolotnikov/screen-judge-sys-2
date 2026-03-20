import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

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
    const { email, password } = data;

    if (!email || !email.includes('@') || !password) {
      return new NextResponse(
        JSON.stringify({
          message: 'Invalid Data',
          status: 422,
        }),
        { status: 422 }
      );
    }

    const client = await clientPromise;
    const db = client.db('screen-handler');
    const existingUser = await db.collection('users').findOne({ email });

    if (existingUser) {
      return new NextResponse(
        JSON.stringify({
          message: 'User already exists',
          status: 422,
        }),
        { status: 422 }
      );
    }

    const salt = parseInt(process.env.BCRYPT_SALT || '12', 10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const timestamp = Date.now();
    const dateObject = new Date(timestamp);
    const date = dateObject.getDate();
    const month = dateObject.getMonth() + 1;
    const year = dateObject.getFullYear();
    const hour = dateObject.getHours();
    const minute = dateObject.getMinutes();
    const second = dateObject.getSeconds();

    await db.collection('users').insertOne({
      email: email,
      password: hashedPassword,
      name: null,
      image: null,
      emailVerified: `${year}-${month}-${date} ${hour}:${minute}:${second}`,
      role: 'User',
      telephone: null,
      parties: [],
      createdAt: new Date().toISOString(),
    });

    return new NextResponse(
      JSON.stringify({
        message: 'User created successfully',
        status: 201,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return new NextResponse(
      JSON.stringify({
        message: 'Internal server error',
        status: 500,
      }),
      { status: 500 }
    );
  }
}
