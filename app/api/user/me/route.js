import connectDB from "@/lib/Db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Login karein pehle!" }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "vitta_lekha_key");
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return NextResponse.json({ message: "User nahi mila" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("Auth Error:", error);
    return NextResponse.json({ message: "Invalid session" }, { status: 401 });
  }
}