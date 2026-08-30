import { redirect } from "next/navigation";
export default async function DirectoryPage({ params }: { params: Promise<{ kind: string }> }) { const { kind } = await params; redirect(`/en/directory/${kind}`); }
