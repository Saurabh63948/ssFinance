
import connectDB from "@/lib/Db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();
    const { userId, newEndDate, fine, date } = await req.json();
    const user = await User.findById(userId);
    const extensionFine = Number(fine || 0);
    if (extensionFine > 0) {
      user.collections.push({
        date: date ? new Date(date) : new Date(),
        amountCollected: 0,
        lateFine: extensionFine,
        remarks: "Extension Penalty",
        addedBy: "Admin"
      });
    }
    const totalF = user.collections.reduce((acc, c) => acc + (c.lateFine || 0), 0);
    const totalP = user.collections.reduce((acc, c) => acc + (c.amountCollected || 0), 0);
    const balance = (user.loanDetails.totalPayableWithInterest + totalF) - totalP;
    const today = new Date();
    const end = new Date(newEndDate);
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24)) || 1;
    user.loanDetails.endDate = newEndDate;
    user.loanDetails.dailyPayableAmount = (balance / diffDays).toFixed(2);
    await user.save();
    return NextResponse.json({ message: "Success", newDailyAmount: user.loanDetails.dailyPayableAmount });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}