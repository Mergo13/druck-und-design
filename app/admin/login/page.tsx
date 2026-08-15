import { Suspense } from "react";
import { AdminLoginForm } from "@/features/account/admin-login-form";

export default function AdminLoginPage() {
  return (
    <section className="container-page grid min-h-[70vh] items-center py-10">
      <Suspense fallback={<div className="mx-auto w-full max-w-md p-8 text-center">Laden...</div>}>
        <AdminLoginForm />
      </Suspense>
    </section>
  );
}
