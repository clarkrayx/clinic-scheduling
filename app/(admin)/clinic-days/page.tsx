import { prisma } from "@/lib/prisma";
import ClinicDaysView from "./ClinicDaysView";

export default async function ClinicDaysPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year ?? String(now.getFullYear()));
  const month = parseInt(params.month ?? String(now.getMonth() + 1));

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const clinicDays = await prisma.clinicDay.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    include: {
      sessions: { include: { doctor: true } },
    },
    orderBy: { date: "asc" },
  });

  const doctors = await prisma.doctor.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <ClinicDaysView
      year={year}
      month={month}
      clinicDays={clinicDays}
      doctors={doctors}
    />
  );
}
