import { auth, createClerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function DELETE() {
  try {
    const { userId: clerkId } = await auth.protect();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Delete user from PostgreSQL database (cascades to company, scans, prompts, recommendations, provider preferences, subscription)
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (user) {
      await prisma.user.delete({
        where: { clerkId },
      });
    }

    // 2. Delete user account from Clerk Authentication directory
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (clerkSecretKey) {
      const clerk = createClerkClient({ secretKey: clerkSecretKey });
      await clerk.users.deleteUser(clerkId).catch((err) => {
        console.warn("Clerk deleteUser warning:", err);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Account and associated data deleted successfully.",
    });
  } catch (error) {
    console.error("Account deletion failed:", error);
    return NextResponse.json(
      { error: "Failed to delete account and data" },
      { status: 500 }
    );
  }
}
