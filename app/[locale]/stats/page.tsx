import { redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function LocaleStatsRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  redirect(`/${locale}/analytics`);
}
