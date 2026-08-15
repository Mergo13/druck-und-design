import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/account/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <section className="container-page grid min-h-[70vh] items-center py-10">
      <Suspense fallback={<div className="mx-auto w-full max-w-md p-8 text-center">Laden...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </section>
  );
}
