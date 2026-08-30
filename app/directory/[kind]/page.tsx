import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n";
export default async function DirectoryPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  redirect(`/${defaultLocale}/directory/${kind}`);
}
