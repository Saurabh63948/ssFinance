
import connectDB from "@/lib/Db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();
    const { userId, entryId } = await req.json();

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ message: "User not found!" }, { status: 404 });

    // 1. Entry delete karo
    user.collections = user.collections.filter(
      (item) => item._id.toString() !== entryId
    );

    // 2. EMI Recalculation Logic
    const totalFines = user.collections.reduce((acc, curr) => acc + (Number(curr.lateFine) || 0), 0);
    const totalPaid = user.collections.reduce((acc, curr) => acc + (Number(curr.amountCollected) || 0), 0);
    
    // Balance = (Original Loan + Fines) - Paid
    const currentOutstanding = (Number(user.loanDetails.totalPayableWithInterest) + totalFines) - totalPaid;

    const today = new Date();
    const endDate = new Date(user.loanDetails.endDate);
    const diffTime = endDate - today;
    const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const divisor = remainingDays > 0 ? remainingDays : 1;
    user.loanDetails.dailyPayableAmount = currentOutstanding > 0 
      ? (currentOutstanding / divisor).toFixed(2) 
      : 0;

    await user.save();
    return NextResponse.json({ message: "Entry Deleted & EMI Updated" });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}