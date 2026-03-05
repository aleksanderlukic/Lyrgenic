// app/app/settings/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/settings-client";

export const metadata = { title: "Settings – Lyrgenic" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/sign-in");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      stripeSubId: true,
      createdAt: true,
    },
  });

  if (!user || !user.email) redirect("/auth/sign-in");

  return <SettingsClient user={{ ...user, email: user.email }} />;
}
