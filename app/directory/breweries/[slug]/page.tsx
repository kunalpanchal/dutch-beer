import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n";

export default async function BreweryRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/${defaultLocale}/directory/breweries/${slug}`);
}
