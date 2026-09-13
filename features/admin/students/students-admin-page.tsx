"use client";

import { AdminModulePage } from "@/features/admin/modules/admin-module-page";
import { PageHeader } from "@/components/admin/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function StudentsAdminPage() {
  return (
    <>
      <PageHeader title="Studenten" description="Studenten-Ratgeber und Studentenstatus-Prüfungen aus der bestehenden Admin-Verwaltung." />
      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles">Ratgeber</TabsTrigger>
          <TabsTrigger value="verifications">Studentenprüfungen</TabsTrigger>
        </TabsList>
        <TabsContent value="articles">
          <AdminModulePage moduleKey="studentArticles" title="Studenten-Ratgeber" description="SEO- und Ratgeberartikel für den Studentenbereich." />
        </TabsContent>
        <TabsContent value="verifications">
          <AdminModulePage moduleKey="studentVerifications" title="Studentenprüfungen" description="Eingereichte Nachweise prüfen und Status setzen." allowCreate={false} allowDelete={false} />
        </TabsContent>
      </Tabs>
    </>
  );
}
