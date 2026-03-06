import { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4">
      <Suspense>
        <SignupForm />
      </Suspense>
    </main>
  );
}
