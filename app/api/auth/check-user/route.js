
import connectDB from "@/lib/Db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();
    const { phone } = await req.json();

    const user = await User.findOne({ phoneNumber: phone });

    if (!user) {
      return NextResponse.json({ exists: false, message: "no record found with this number" }, { status: 404 });
    }

    return NextResponse.json({ exists: true });
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}