import { LoginForm } from "@/features/account/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <section className="container-page grid min-h-[70vh] items-center py-10">
      <Suspense fallback={<div className="mx-auto w-full max-w-md p-8 text-center">Laden...</div>}>
        <LoginForm />
      </Suspense>
    </section>
  );
}
