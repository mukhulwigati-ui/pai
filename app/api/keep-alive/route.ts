// app/api/keep-alive/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      success: true,
      message: "Database Supabase aktif",
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Keep-alive error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menghubungi database",
      },
      { status: 500 }
    );
  }
}