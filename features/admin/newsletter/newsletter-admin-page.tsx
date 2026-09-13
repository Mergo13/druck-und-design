"use client";

import { PageHeader } from "@/components/admin/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminModulePage } from "@/features/admin/modules/admin-module-page";

export function NewsletterAdminPage() {
  return (
    <>
      <PageHeader title="Newsletter" description="Kontakte und Kampagnen aus der bestehenden Newsletter-Verwaltung." />
      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts">Kontakte</TabsTrigger>
          <TabsTrigger value="campaigns">Kampagnen</TabsTrigger>
        </TabsList>
        <TabsContent value="contacts">
          <AdminModulePage moduleKey="newsletter" title="Newsletter-Kontakte" description="Abonnenten verwalten und aktivieren/deaktivieren." />
        </TabsContent>
        <TabsContent value="campaigns">
          <AdminModulePage moduleKey="newsletterCampaigns" title="Newsletter-Kampagnen" description="Kampagnen erstellen, bearbeiten und bei Status Gesendet auslösen." />
        </TabsContent>
      </Tabs>
    </>
  );
}
