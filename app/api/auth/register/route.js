
import connectDB from "@/lib/Db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();
    const { name, phoneNumber, email, password, role } = await req.json();
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      phoneNumber,
      email,
      password: hashedPassword,
      role: role || "USER", 
    });

    return NextResponse.json({ message: "User created", user: newUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: error.message }, { status: 500 });
  }
}