import { auth } from "@clerk/nextjs/server";
import { EditorLayout } from "@/components/editor/editor-layout";

export default async function ProtectedEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await auth.protect();

  return <EditorLayout domainName="shopify.com">{children}</EditorLayout>;
}
