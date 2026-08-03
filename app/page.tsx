import { EditorLayout } from "@/components/editor/editor-layout";

export default function Home() {
  return (
    <EditorLayout domainName="shopify.com">
      <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center min-h-[60vh] bg-card/40">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          AnswerOS Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground max-w-md">
          Track and optimize your business visibility across ChatGPT, Claude, Gemini, and Perplexity.
        </p>
      </div>
    </EditorLayout>
  );
}
