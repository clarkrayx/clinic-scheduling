import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { role } = await req.json();

  if (!["ASSISTANT", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "無效的角色" }, { status: 400 });
  }

  // Cannot change own role
  if (id === session.user.id) {
    return NextResponse.json({ error: "無法修改自己的角色" }, { status: 400 });
  }

  await prisma.user.update({ where: { id }, data: { role } });
  return NextResponse.json({ ok: true });
}
