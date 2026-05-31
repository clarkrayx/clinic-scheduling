import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  const adminPassword = await bcrypt.hash("admin1234", 12);
  const managerPassword = await bcrypt.hash("manager1234", 12);
  const assistantPassword = await bcrypt.hash("assistant1234", 12);

  // Create admin
  await prisma.user.upsert({
    where: { email: "clarkrayx@gmail.com" },
    update: {},
    create: {
      email: "clarkrayx@gmail.com",
      password: adminPassword,
      name: "系統管理者",
      role: "ADMIN",
    },
  });

  // Create a manager
  await prisma.user.upsert({
    where: { email: "manager@clinic.com" },
    update: {},
    create: {
      email: "manager@clinic.com",
      password: managerPassword,
      name: "陳美玲",
      role: "MANAGER",
    },
  });

  // Create some assistants
  const assistantNames = ["林小華", "王淑芬", "李雅婷", "張佳穎", "吳宜蓉", "劉明珠"];
  for (let i = 0; i < assistantNames.length; i++) {
    const name = assistantNames[i];
    const email = `assistant${i + 1}@clinic.com`;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          password: assistantPassword,
          name,
          role: "ASSISTANT",
          assistant: {
            create: {
              skills: i % 2 === 0 ? ["counter", "mobile"] : ["mobile", "dental"],
            },
          },
        },
      });
    }
  }

  // Create some doctors
  const doctorNames = ["林俊傑", "陳雅芳", "王大明"];
  for (const name of doctorNames) {
    await prisma.doctor.upsert({
      where: { id: name },
      update: {},
      create: { id: name, name, specialty: "牙科" },
    }).catch(() => prisma.doctor.create({ data: { name, specialty: "牙科" } }));
  }

  // Create default rules
  const defaultRules = [
    { title: "每日最多 2 診", description: "每位助理一天最多只能排 2 個診次，避免過度疲勞", ruleType: "max_sessions_per_day", config: '{"max": 2}' },
    { title: "每週至少休息 2 天", description: "每位助理每週至少要有 2 天不排班", ruleType: "min_days_off_per_week", config: '{"min": 2}' },
    { title: "避免連續 5 天以上", description: "不可安排同一位助理連續上班超過 5 天", ruleType: "max_consecutive_days", config: '{"max": 5}' },
    { title: "公平分配原則", description: "每月每位助理的總診次數應盡量均等，差距不超過 3 次", ruleType: "custom", config: '{"maxDiff": 3}' },
  ];

  for (const rule of defaultRules) {
    const exists = await prisma.specialRule.findFirst({ where: { title: rule.title } });
    if (!exists) {
      await prisma.specialRule.create({ data: rule });
    }
  }

  return NextResponse.json({ ok: true, message: "初始資料建立完成" });
}
