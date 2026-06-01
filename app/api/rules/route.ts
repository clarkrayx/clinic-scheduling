import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, ruleType, config, isMandatory } = await req.json();
  const rule = await prisma.specialRule.create({
    data: { title, description, ruleType, config: config ?? "{}", isMandatory: isMandatory !== false },
  });
  return NextResponse.json(rule);
}
