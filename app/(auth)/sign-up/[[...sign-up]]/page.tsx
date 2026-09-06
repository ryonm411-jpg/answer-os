import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="space-y-4 flex flex-col items-center">
      <SignUp fallbackRedirectUrl="/onboarding" />
      <p className="text-[11px] text-center text-muted-foreground max-w-xs leading-relaxed">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground">
          Terms of Service
        </Link>{" "}
        and acknowledge our{" "}
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>.
      </p>
    </div>
  );
}
