import connectDB from "@/lib/Db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();

    const users = await User.find({ role: "USER" });

    // 1. Total Market Principal
    const totalPrincipal = users.reduce((acc, user) => acc + (user.loanDetails?.principalAmount || 0), 0);

    // 2. Active Borrowers
    const activeBorrowers = users.filter(u => u.loanDetails?.hasActiveLoan).length;

    // 3. Today's Collection & Fines
    const today = new Date().setHours(0, 0, 0, 0);
    let todayColl = 0;
    let totalFines = 0;
    let recentTransactions = [];

    users.forEach(user => {
      user.collections.forEach(col => {
        const colDate = new Date(col.date).setHours(0, 0, 0, 0);
        if (colDate === today) {
          todayColl += col.amountCollected;
        }
        totalFines += (col.lateFine || 0);
        recentTransactions.push({
          name: user.name,
          date: col.date,
          amount: col.amountCollected,
          fine: col.lateFine,
          id: user._id
        });
      });
    });
    recentTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    return NextResponse.json({
      stats: {
        totalPrincipal,
        activeBorrowers,
        todayCollection: todayColl,
        totalFines
      },
      recentTransactions: recentTransactions.slice(0, 5)
    });

  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}