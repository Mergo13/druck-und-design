import { AdminTwoFactorForm } from "@/features/account/admin-2fa-form";

export default function AdminVerify2FAPage() {
  return (
    <section className="container-page grid min-h-[70vh] items-center py-10">
      <AdminTwoFactorForm />
    </section>
  );
}
