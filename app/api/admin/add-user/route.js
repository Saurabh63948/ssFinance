import connectDB from "@/lib/Db";
import User from "@/models/User";
import cloudinary from "@/lib/cloudinary";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

const UserSchemaZ = z.object({
  name: z.string().min(2),
  phoneNumber: z.string().length(10),
  aadhaarNumber: z.string().length(12),
  principalAmount: z.string(),
  interestRate: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export async function POST(req) {
  try {
    await connectDB();
    const formData = await req.formData();
    const body = Object.fromEntries(formData);
    
    // Zod validation
    const validatedData = UserSchemaZ.parse(body);

    const frontImg = formData.get("frontSide");
    const backImg = formData.get("backSide");

    // Cloudinary Upload Logic
    const uploadToCloudinary = async (file) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "vitta-lekha-aadhaar" },
          (err, result) => { if (err) reject(err); else resolve(result); }
        ).end(buffer);
      });
    };

    const frontRes = await uploadToCloudinary(frontImg);
    const backRes = await uploadToCloudinary(backImg);

    // --- Loan Calculations ---
    const principal = Number(validatedData.principalAmount);
    const interestTotal = (principal * Number(validatedData.interestRate)) / 100;
    const totalPayable = principal + interestTotal;

    const start = new Date(validatedData.startDate);
    const end = new Date(validatedData.endDate);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const dailyAmount = (totalPayable / totalDays).toFixed(2);
    const hashedPassword = await bcrypt.hash(validatedData.phoneNumber, 10);

    // --- Fixed User.create Logic ---
    const newUser = await User.create({
      name: validatedData.name,
      phoneNumber: validatedData.phoneNumber,
      aadhaarNumber: validatedData.aadhaarNumber,
      password: hashedPassword,
      role: "USER", // Default role
      aadhaarImages: {
        frontSide: { url: frontRes.secure_url, publicId: frontRes.public_id },
        backSide: { url: backRes.secure_url, publicId: backRes.public_id }
      },
      loanDetails: {
        hasActiveLoan: true,
        principalAmount: principal,
        interestRate: Number(validatedData.interestRate),
        startDate: start,
        endDate: end,
        dailyPayableAmount: Number(dailyAmount),
        totalPayableWithInterest: totalPayable
      }
    });

    return NextResponse.json({ message: "User created with images in DB!", user: newUser }, { status: 201 });
  } catch (error) {
    console.error("DB Error:", error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}