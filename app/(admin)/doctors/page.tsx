import { prisma } from "@/lib/prisma";
import DoctorsView from "./DoctorsView";

export default async function DoctorsPage() {
  const doctors = await prisma.doctor.findMany({
    orderBy: { createdAt: "asc" },
  });
  return <DoctorsView doctors={doctors} />;
}
