import connectDB from "@/lib/Db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();
    const { userId, entryId, amount, lateFine, remarks, date } = await req.json();

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ message: "User not found!" }, { status: 404 });
    const entry = user.collections.id(entryId); 
    if (!entry) {
      return NextResponse.json({ message: "Transaction entry not found!" }, { status: 404 });
    }

    entry.amountCollected = Number(amount);
    entry.lateFine = Number(lateFine);
    entry.remarks = remarks;
    entry.date = new Date(date);

    const totalFines = user.collections.reduce((acc, curr) => acc + (Number(curr.lateFine) || 0), 0);
    const totalPaid = user.collections.reduce((acc, curr) => acc + (Number(curr.amountCollected) || 0), 0);
    
    const currentOutstanding = (Number(user.loanDetails.totalPayableWithInterest) + totalFines) - totalPaid;

    const today = new Date();
    today.setHours(0,0,0,0);
    const endDate = new Date(user.loanDetails.endDate);
    
    const diffTime = endDate - today;
    const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const divisor = remainingDays > 0 ? remainingDays : 1;

    user.loanDetails.dailyPayableAmount = currentOutstanding > 0 
      ? (currentOutstanding / divisor).toFixed(2) 
      : 0;

    await user.save();
    
    return NextResponse.json({ message: "Entry Updated & EMI Adjusted", newOutstanding: currentOutstanding });
  } catch (error) {
    console.error("Edit Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}