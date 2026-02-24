
import connectDB from "@/lib/Db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();
    const { userId, amount, lateFine, remarks, date } = await req.json();
    const user = await User.findById(userId);

    // 1. Add Entry to History
    if (Number(amount) > 0 || Number(lateFine) > 0) {
      user.collections.push({
        date: date ? new Date(date) : new Date(),
        amountCollected: Number(amount) || 0,
        lateFine: Number(lateFine) || 0,
        remarks: remarks || (Number(lateFine) > 0 ? "Late Fine" : "EMI Paid"),
        addedBy: "Admin"
      });
    }

    // 2. RE-CALCULATE DAILY KIST (VERY IMPORTANT)
    const totalFines = user.collections.reduce((acc, curr) => acc + (curr.lateFine || 0), 0);
    const totalPaid = user.collections.reduce((acc, curr) => acc + (curr.amountCollected || 0), 0);
    const currentBalance = (user.loanDetails.totalPayableWithInterest + totalFines) - totalPaid;

    const today = new Date();
    const end = new Date(user.loanDetails.endDate);
    const remainingDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24)) || 1;


    user.loanDetails.dailyPayableAmount = currentBalance > 0 
      ? (currentBalance / Math.max(remainingDays, 1)).toFixed(2) 
      : 0;

    await user.save();
    return NextResponse.json({ message: "Success" });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}