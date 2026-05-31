import { prisma } from "@/lib/prisma";
import DoctorsView from "./DoctorsView";

export default async function DoctorsPage() {
  const [doctors, assistants] = await Promise.all([
    prisma.doctor.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.assistant.findMany({
      where: { isActive: true },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return <DoctorsView doctors={doctors} assistants={assistants} />;
}
