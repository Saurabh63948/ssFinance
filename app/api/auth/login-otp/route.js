import connectDB from "@/lib/Db";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();

    const { phone } = await req.json();

    const user = await User.findOne({ phoneNumber: phone });

    if (!user) {
      return NextResponse.json(
        { message: "this number is not registered plz contact the authorised person" },
        { status: 404 }
      );
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET || "vitta_lekha_key",
      {
        expiresIn: "1d",
      }
    );

    const response = NextResponse.json({
      message: "login successfull !",
      user: {
        name: user.name,
        role: user.role,
        phone: user.phoneNumber,
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Login API Error:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}