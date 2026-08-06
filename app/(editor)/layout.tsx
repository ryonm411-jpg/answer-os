import { auth } from "@clerk/nextjs/server";
import { EditorLayout } from "@/components/editor/editor-layout";
import { getCompanyByClerkId } from "@/lib/db/companies";

export default async function ProtectedEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId: clerkId } = await auth.protect();
  const company = clerkId ? await getCompanyByClerkId(clerkId) : null;

  return <EditorLayout domainName={company?.domain}>{children}</EditorLayout>;
}
