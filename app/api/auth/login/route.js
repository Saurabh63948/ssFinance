import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/Db";

export async function POST(req) {
  try {
    await connectDB();
    const { identifier, password } = await req.json();
    
    const user = await User.findOne({
      $or: [{ phoneNumber: identifier }, { email: identifier }],
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "vitta_lekha_key", 
      { expiresIn: "1d" }
    );

    const response = NextResponse.json({
      message: "Login successful",
      user: { name: user.name, role: user.role, phone: user.phoneNumber },
    });
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}