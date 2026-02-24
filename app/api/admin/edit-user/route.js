import connectDB from "@/lib/Db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();
    const formData = await req.formData();
    
    const userId = formData.get("userId");
    const name = formData.get("name");
    const phoneNumber = formData.get("phoneNumber");
    const aadhaarNumber = formData.get("aadhaarNumber");
    const principalAmount = Number(formData.get("principalAmount"));
    const interestRate = Number(formData.get("interestRate"));
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const totalInterest = (principalAmount * interestRate) / 100;
    const totalPayableWithInterest = principalAmount + totalInterest;
    const dailyPayableAmount = Math.ceil(totalPayableWithInterest / diffDays);
    const updateData = {
      name,
      phoneNumber,
      aadhaarNumber,
      "loanDetails.principalAmount": principalAmount,
      "loanDetails.interestRate": interestRate,
      "loanDetails.startDate": startDate,
      "loanDetails.endDate": endDate,
      "loanDetails.totalPayableWithInterest": totalPayableWithInterest,
      "loanDetails.dailyPayableAmount": dailyPayableAmount,
    };
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Borrower updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Edit Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}