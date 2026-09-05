import { NextResponse } from "next/server";
import { getSearchIndex } from "@/lib/catalog/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const index = await getSearchIndex();
  return NextResponse.json(index, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
