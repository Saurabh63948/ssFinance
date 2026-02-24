import connectDB from "@/lib/Db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const user = await User.findOne({ phoneNumber: phone });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}