"use client";

import {
  ChevronDown,
  CreditCard,
  Download,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  Star,
  UserCircle2,
  X,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const navigation: Array<[LucideIcon, string, string]> = [
  [LayoutDashboard, "Uebersicht", "#orders"],
  [Package, "Bestellungen", "#orders"],
  [CreditCard, "Rechnungen", "#invoices"],
  [UserCircle2, "Kontoeinstellungen", "#settings"],
  [ShieldCheck, "Studentenstatus", "#student-status"],
  [LifeBuoy, "Reklamationen", "#support"],
  [Settings, "Einstellungen", "#security"]
];

const projects = [];
const tickets = [];

function projectStatusClass(status: string) {
  if (status === "In Produktion") return "bg-blue-100 text-blue-700";
  if (status === "Freigabe ausstehend") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function invoiceStatusClass(status: string) {
  if (status === "Bezahlt") return "bg-emerald-100 text-emerald-700";
  if (status === "Offen") return "bg-amber-100 text-amber-700";
  if (status === "Gutschein") return "bg-sky-100 text-sky-700";
  return "bg-rose-100 text-rose-700";
}

function ticketStatusClass(state: string) {
  if (state === "Gelöst") return "bg-emerald-100 text-emerald-700";
  if (state === "In Bearbeitung") return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-700";
}

export function AccountDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [invoicesData, setInvoicesData] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    company: "",
    vatId: "",
    phone: "",
    email: "",
    billingAddress: "",
    shippingAddress: ""
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordMessage, setPasswordMessage] = useState({ text: "", type: "info" as "info" | "success" | "error" });
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [activeSearchField, setActiveSearchField] = useState<"billing" | "shipping" | null>(null);
  const [reviewForm, setReviewForm] = useState({ productSlug: "", productName: "", rating: 5, comment: "" });
  const [reviewMessage, setReviewMessage] = useState({ text: "", type: "info" as "info" | "success" | "error" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [studentUniversity, setStudentUniversity] = useState("");
  const [studentIdFile, setStudentIdFile] = useState<File | null>(null);
  const [studentUploadMessage, setStudentUploadMessage] = useState({ text: "", type: "info" as "info" | "success" | "error" });
  const [submittingStudentId, setSubmittingStudentId] = useState(false);

  async function loadAccountData() {
    const profileRes = await fetch("/api/user/profile");
    if (!profileRes.ok) {
      setAuthenticated(false);
      return;
    }
    const profileData = await profileRes.json();
    setAuthenticated(true);
    setEmail(profileData.email ?? "");
    setProfile(profileData);
    setStudentUniversity(profileData.studentVerification?.university || "");
    setProfileForm({
      fullName: profileData.fullName || "",
      company: profileData.company || "",
      vatId: profileData.vatId || "",
      phone: profileData.phone || "",
      email: profileData.email || "",
      billingAddress: profileData.billingAddress || "",
      shippingAddress: profileData.shippingAddress || ""
    });

    const [ordersRes, invoicesRes] = await Promise.all([
      fetch("/api/orders"),
      fetch("/api/user/invoices")
    ]);
    if (ordersRes.ok) {
      const ordersData = await ordersRes.json();
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    }
    if (invoicesRes.ok) {
      const invoiceRows = await invoicesRes.json();
      setInvoicesData(Array.isArray(invoiceRows) ? invoiceRows : []);
    }
  }

  async function handleStudentVerificationUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!studentIdFile) {
      setStudentUploadMessage({ text: "Bitte einen Studentenausweis als PDF oder Bild auswählen.", type: "error" });
      return;
    }
    setSubmittingStudentId(true);
    setStudentUploadMessage({ text: "", type: "info" });
    const formData = new FormData();
    formData.append("university", studentUniversity);
    formData.append("file", studentIdFile);
    try {
      const res = await fetch("/api/uploads/student-id", { method: "POST", body: formData });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Upload fehlgeschlagen.");
      await loadAccountData();
      setStudentIdFile(null);
      setStudentUploadMessage({ text: "Studentenstatus wurde zur Prüfung eingereicht.", type: "success" });
    } catch (error) {
      setStudentUploadMessage({ text: error instanceof Error ? error.message : "Upload fehlgeschlagen.", type: "error" });
    } finally {
      setSubmittingStudentId(false);
    }
  }

  useEffect(() => {
    loadAccountData()
      .catch(() => setAuthenticated(false));
  }, []);

  async function handleAddressSearch(query: string, field: "billing" | "shipping") {
    setProfileForm({ ...profileForm, [field === "billing" ? "billingAddress" : "shippingAddress"]: query });
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=de`);
      if (res.ok) {
        const data = await res.json();
        setAddressSuggestions(data.features || []);
        setActiveSearchField(field);
      }
    } catch (err) {
      console.error("Address search error:", err);
    }
  }

  function selectAddress(suggestion: any, field: "billing" | "shipping") {
    const p = suggestion.properties;
    const addressParts = [
      p.street ? `${p.street}${p.housenumber ? " " + p.housenumber : ""}` : p.name,
      p.postcode && p.city ? `${p.postcode} ${p.city}` : p.city || p.postcode,
      p.country || ""
    ].filter(Boolean);
    
    const formattedAddress = addressParts.join("\n");
    
    setProfileForm({
      ...profileForm,
      [field === "billing" ? "billingAddress" : "shippingAddress"]: formattedAddress
    });
    setAddressSuggestions([]);
    setActiveSearchField(null);
  }

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setEmail(data.user?.email || email);
        await loadAccountData();
        setIsEditingProfile(false);
        alert("Profil erfolgreich aktualisiert.");
      } else {
        alert("Fehler beim Aktualisieren des Profils.");
      }
    } catch (err) {
      console.error(err);
      alert("Ein Fehler ist aufgetreten.");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (!authenticated) {
    return (
      <section className="container-page py-10">
        <p className="font-bold text-primary">Kundenkonto</p>
        <h1 className="mt-2 text-4xl font-black">Bitte einloggen</h1>
        <div className="mt-6 flex gap-3">
          <Button asChild><Link href="/login">Einloggen</Link></Button>
          <Button asChild variant="outline"><Link href="/registrierung">Registrieren</Link></Button>
        </div>
      </section>
    );
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ text: "Passwörter stimmen nicht überein", type: "error" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ text: "Das Passwort muss mindestens 6 Zeichen lang sein", type: "error" });
      return;
    }

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordMessage({ text: data.message || "Fehler beim Ändern des Passworts", type: "error" });
      } else {
        setPasswordMessage({ text: "Passwort erfolgreich geändert", type: "success" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      setPasswordMessage({ text: "Netzwerkfehler", type: "error" });
    }
  }

  function prepareReview(order: any) {
    const firstItem = Array.isArray(order.items) ? order.items[0] : null;
    setReviewForm({
      productSlug: String(firstItem?.productSlug ?? ""),
      productName: String(firstItem?.name ?? firstItem?.productName ?? ""),
      rating: 5,
      comment: ""
    });
    setReviewMessage({ text: "", type: "info" });
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmittingReview(true);
    setReviewMessage({ text: "", type: "info" });
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          productSlug: reviewForm.productSlug,
          productName: reviewForm.productName,
          rating: reviewForm.rating,
          comment: reviewForm.comment
        })
      });
      const payload = await response.json().catch(() => ({ message: "Bewertung konnte nicht gespeichert werden." }));
      if (!response.ok) {
        setReviewMessage({ text: payload.message ?? "Bewertung konnte nicht gespeichert werden.", type: "error" });
        return;
      }
      setReviewMessage({ text: payload.message ?? "Danke. Die Bewertung wartet auf Freigabe.", type: "success" });
      setReviewForm((current) => ({ ...current, comment: "" }));
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <section className="container-page py-6 md:py-8">
      <div className="glass-panel overflow-hidden rounded-xl">
        <div className="flex min-h-[calc(100vh-6rem)] flex-col lg:flex-row">
            <aside className="hidden w-72 shrink-0 border-r bg-muted/35 lg:flex lg:flex-col">
            <div className="border-b px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kundenkonto</p>
              <p className="mt-1 text-lg font-black">Konto</p>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {navigation.map(([Icon, label, href]) => (
                <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted" href={href} key={label}>
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{label}</span>
                </a>
              ))}
            </nav>
            <div className="border-t p-4">
              <div className="rounded-md border bg-background p-3 text-xs text-muted-foreground text-center">
                <Button asChild size="sm" className="w-full">
                  <Link href="/">Zum Shop</Link>
                </Button>
                <p className="mt-2 text-[10px]">Stöbern Sie in unserem Sortiment</p>
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="border-b px-4 py-3 md:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button onClick={() => setMobileMenuOpen((prev) => !prev)} size="icon" variant="outline" className="lg:hidden" aria-label="Menü öffnen">
                    {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  </Button>
                  <div>
                    <h1 className="text-lg font-black md:text-2xl">Uebersicht</h1>
                    <p className="text-xs text-muted-foreground md:text-sm">Angemeldet als {email}</p>
                  </div>
                </div>

                <div className="relative">
                  <Button onClick={() => setUserMenuOpen((prev) => !prev)} variant="outline" size="sm" className="pr-2">
                    <UserCircle2 className="h-4 w-4" />
                    <span className="max-w-[150px] truncate text-xs md:max-w-[220px] md:text-sm">{email}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-11 z-20 w-48 rounded-md border bg-background p-1 shadow-lg">
                      <a
                        className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-muted"
                        href="#settings"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Kontoeinstellungen
                      </a>
                      <a
                        className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-muted"
                        href="#security"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Sicherheit
                      </a>
                      <button className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-rose-600 hover:bg-rose-50" onClick={() => void logout()} type="button">
                        <LogOut className="h-4 w-4" />
                        Ausloggen
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {mobileMenuOpen && (
                <nav className="mt-3 grid gap-1 rounded-md border bg-muted/35 p-2 lg:hidden">
                  {navigation.map(([Icon, label, href]) => (
                    <a
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted"
                      href={href}
                      key={label}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      {label}
                    </a>
                  ))}
                </nav>
              )}
            </header>

            <main className="flex-1 space-y-6 p-4 md:p-6">
              <section id="orders">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-black md:text-xl">Bestellungen</h2>
                  <Button asChild size="sm">
                    <Link href="/">Zum Shop</Link>
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {orders.length > 0 ? orders.map((order, idx) => (
                    <motion.article
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.18) }}
                      className="glass-panel rounded-xl p-4"
                      key={order.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold">Bestellung {order.id.slice(0, 15)}...</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("de-DE")}</p>
                        </div>
                        <span className={`rounded px-2 py-1 text-xs font-semibold ${order.status === "Bezahlt" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-black">€{Number(order.total).toFixed(2)}</p>
                      <div className="mt-3 flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-[10px]"
                          onClick={() => {
                            setSelectedOrder(order);
                            prepareReview(order);
                          }}
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px]"
                          onClick={() => {
                            setSelectedOrder(order);
                            prepareReview(order);
                          }}
                        >
                          Bewerten
                        </Button>
                      </div>
                    </motion.article>
                  )) : (
                    <div className="col-span-full rounded-md border border-dashed p-8 text-center">
                      <p className="text-sm text-muted-foreground">Keine Bestellungen gefunden.</p>
                      <Button asChild variant="outline" className="mt-2">
                        <Link href="/">Jetzt im Shop stöbern</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </section>

              <section id="invoices">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-black md:text-xl">Rechnungen & Gutscheine</h2>
                </div>
                <div className="glass-panel overflow-x-auto rounded-xl">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Dokument</th>
                        <th className="px-4 py-3">Bestellung</th>
                        <th className="px-4 py-3">Datum</th>
                        <th className="px-4 py-3">Betrag</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">PDF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoicesData.map((invoice) => (
                        <tr className="border-t" key={invoice.id}>
                          <td className="px-4 py-3 font-semibold">{invoice.invoiceNumber || invoice.id}</td>
                          <td className="px-4 py-3">{invoice.orderId ? `${String(invoice.orderId).slice(0, 12)}...` : "-"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(invoice.createdAt).toLocaleDateString("de-DE")}</td>
                          <td className="px-4 py-3 font-semibold">€{Number(invoice.amount).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded px-2 py-1 text-xs font-semibold ${invoiceStatusClass(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {invoice.pdfUrl ? (
                              <Button asChild size="sm" variant="outline" className="h-8 gap-1 text-xs">
                                <a href={invoice.pdfUrl} target="_blank" rel="noreferrer">
                                  <Download className="h-3.5 w-3.5" />
                                  {invoice.source === "coupon" ? "Gutschein" : "PDF"}
                                </a>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Nicht verfügbar</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {invoicesData.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Keine Rechnungen oder Gutscheine vorhanden.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section id="settings">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-black md:text-xl">Kontoeinstellungen</h2>
                  {!isEditingProfile && (
                    <Button onClick={() => setIsEditingProfile(true)} size="sm" variant="outline">
                      Bearbeiten
                    </Button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-4 rounded-md border bg-background p-4 shadow-sm">
                    <div className="mb-2 p-2 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-800 uppercase font-bold tracking-wider">
                      Kontodaten bearbeiten
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Name</label>
                        <input
                          type="text"
                          value={profileForm.fullName}
                          onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Max Mustermann"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Firma</label>
                        <input
                          type="text"
                          value={profileForm.company}
                          onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Firmenname"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">USt-IdNr. (VAT)</label>
                        <input
                          type="text"
                          value={profileForm.vatId}
                          onChange={(e) => setProfileForm({ ...profileForm, vatId: e.target.value })}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="ATU12345678"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Telefon</label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="+43 664 1234567"
                        />
                      </div>
                      <div className="space-y-2 lg:col-span-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">E-Mail</label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="kontakt@firma.at"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 relative">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Rechnungsadresse</label>
                        <textarea
                          value={profileForm.billingAddress}
                          onChange={(e) => handleAddressSearch(e.target.value, "billing")}
                          onFocus={() => setActiveSearchField("billing")}
                          className="h-24 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Straße, Hausnummer&#10;PLZ Ort&#10;Land"
                        />
                        {activeSearchField === "billing" && addressSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {addressSuggestions.map((s, i) => (
                              <button
                                key={i}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-b last:border-0"
                                onClick={() => selectAddress(s, "billing")}
                              >
                                {s.properties.name || s.properties.street} {s.properties.housenumber}, {s.properties.postcode} {s.properties.city}, {s.properties.country}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 relative">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Lieferadresse</label>
                        <textarea
                          value={profileForm.shippingAddress}
                          onChange={(e) => handleAddressSearch(e.target.value, "shipping")}
                          onFocus={() => setActiveSearchField("shipping")}
                          className="h-24 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Straße, Hausnummer&#10;PLZ Ort&#10;Land (leer lassen wenn identisch)"
                        />
                        {activeSearchField === "shipping" && addressSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {addressSuggestions.map((s, i) => (
                              <button
                                key={i}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-b last:border-0"
                                onClick={() => selectAddress(s, "shipping")}
                              >
                                {s.properties.name || s.properties.street} {s.properties.housenumber}, {s.properties.postcode} {s.properties.city}, {s.properties.country}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="ghost" onClick={() => setIsEditingProfile(false)}>Abbrechen</Button>
                      <Button type="submit">Speichern</Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-md border bg-background p-4">
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
                        <Package className="h-4 w-4 text-primary" />
                        Lieferadresse
                      </h3>
                      <div className="text-sm text-muted-foreground">
                        {profile?.shippingAddress ? (
                          <pre className="font-sans whitespace-pre-wrap">
                            <span className="mb-1 block text-[10px] font-bold text-primary uppercase">Standard Lieferadresse</span>
                            {profile.shippingAddress}
                          </pre>
                        ) : profile?.billingAddress ? (
                          <pre className="font-sans whitespace-pre-wrap">
                            <span className="mb-1 block text-[10px] font-bold text-primary uppercase">Standard Lieferadresse (wie Rechnungsadresse)</span>
                            {profile.billingAddress}
                          </pre>
                        ) : (
                          <p>Keine Adresse hinterlegt.</p>
                        )}
                        <p className="mt-2 text-xs italic">Wird bei der nächsten Bestellung automatisch vorgeschlagen.</p>
                      </div>
                    </div>
                    <div className="rounded-md border bg-background p-4">
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Kontaktdaten
                      </h3>
                      <div className="text-sm text-muted-foreground">
                        {profile?.fullName && <p className="font-bold text-foreground">{profile.fullName}</p>}
                        {profile?.company && <p className="font-bold text-foreground">{profile.company}</p>}
                        {profile?.vatId && <p className="text-xs">USt-IdNr: {profile.vatId}</p>}
                        {profile?.phone && <p className="text-xs">Telefon: {profile.phone}</p>}
                        {profile?.email && <p className="text-xs">E-Mail: {profile.email}</p>}
                        {profile?.billingAddress ? (
                          <pre className="mt-2 font-sans whitespace-pre-wrap">
                            <span className="mb-1 block text-[10px] font-bold text-primary uppercase">Standard Rechnungsadresse</span>
                            {profile.billingAddress}
                          </pre>
                        ) : (
                          <p className="mt-2">Keine Adresse hinterlegt.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section id="student-status">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-black md:text-xl">Studentenstatus</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-[.9fr_1.1fr]">
                  <div className="rounded-md border bg-background p-4">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Aktueller Status
                    </h3>
                    <p className="text-sm font-bold text-foreground">
                      {profile?.studentVerification?.status === "approved" ? "Bestätigt" :
                        profile?.studentVerification?.status === "rejected" ? "Abgelehnt" :
                          profile?.studentVerification?.status === "expired" ? "Abgelaufen" :
                            profile?.studentVerification?.status === "pending" ? "In Prüfung" : "Noch nicht eingereicht"}
                    </p>
                    {profile?.studentVerification?.university ? (
                      <p className="mt-2 text-sm text-muted-foreground">{profile.studentVerification.university}</p>
                    ) : null}
                    {profile?.studentVerification?.validUntil ? (
                      <p className="mt-1 text-xs text-muted-foreground">Gültig bis {profile.studentVerification.validUntil}</p>
                    ) : null}
                    {profile?.studentVerification?.reviewNote ? (
                      <p className="mt-3 rounded-md bg-muted p-3 text-xs text-muted-foreground">{profile.studentVerification.reviewNote}</p>
                    ) : null}
                  </div>
                  <form onSubmit={handleStudentVerificationUpload} className="space-y-4 rounded-md border bg-background p-4 shadow-sm">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Studentenausweis hochladen</h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">Die Datei wird privat gespeichert und ist nicht öffentlich abrufbar.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Universität / FH</label>
                        <input
                          type="text"
                          value={studentUniversity}
                          onChange={(e) => setStudentUniversity(e.target.value)}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="z.B. FH Oberösterreich"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Nachweis</label>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.webp"
                          onChange={(e) => setStudentIdFile(e.target.files?.[0] ?? null)}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          required
                        />
                      </div>
                    </div>
                    {studentUploadMessage.text ? (
                      <p className={studentUploadMessage.type === "error" ? "text-sm font-bold text-red-600" : "text-sm font-bold text-emerald-600"}>{studentUploadMessage.text}</p>
                    ) : null}
                    <div className="flex justify-end">
                      <Button type="submit" disabled={submittingStudentId}>{submittingStudentId ? "Wird hochgeladen..." : "Zur Prüfung senden"}</Button>
                    </div>
                  </form>
                </div>
              </section>

              <section id="support">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-black md:text-xl">Reklamationen</h2>
                  <Button size="sm" variant="outline">
                    <HelpCircle className="h-4 w-4" />
                    Reklamation einreichen
                  </Button>
                </div>
                <div className="rounded-md border bg-background p-8 text-center">
                   <LifeBuoy className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
                   <p className="mt-2 text-sm text-muted-foreground">Keine aktiven Reklamationen.</p>
                </div>
              </section>

              <section id="security">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-black md:text-xl">Sicherheit</h2>
                </div>
                <div className="rounded-md border bg-background p-4 text-sm">
                  <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                    <h3 className="font-bold text-foreground">Passwort ändern</h3>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Aktuelles Passwort</label>
                      <input
                        type="password"
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Neues Passwort</label>
                      <input
                        type="password"
                        required
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Neues Passwort bestätigen</label>
                      <input
                        type="password"
                        required
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {passwordMessage.text && (
                      <p className={`text-xs font-bold ${passwordMessage.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                        {passwordMessage.text}
                      </p>
                    )}

                    <Button type="submit" size="sm">Passwort aktualisieren</Button>
                  </form>
                  <div className="mt-6 border-t pt-4 text-muted-foreground">
                    <p>Ihre Sitzung ist aktiv.</p>
                    <p className="mt-1">Nutzen Sie ein starkes Passwort und melden Sie sich auf fremden Geraeten immer ab.</p>
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-background shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-background px-6 py-4">
              <h3 className="text-xl font-black">Bestelldetails</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Bestellnummer</p>
                  <p className="font-mono text-sm">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Datum</p>
                  <p className="text-sm">{new Date(selectedOrder.createdAt).toLocaleString("de-DE")}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Status</p>
                  <span className={`inline-block mt-1 rounded px-2 py-0.5 text-xs font-semibold ${selectedOrder.status === "Bezahlt" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Gesamtbetrag</p>
                  <p className="text-sm font-black text-primary">€{Number(selectedOrder.total).toFixed(2)}</p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="mb-3 text-sm font-bold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Bestellte Artikel
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items && Array.isArray(selectedOrder.items) ? selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center rounded-md border p-3 text-sm">
                      <div>
                        <p className="font-bold">{item.name || item.productName || "Produkt"}</p>
                        <p className="text-xs text-muted-foreground">Menge: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">€{Number(item.price || item.unitPrice || 0).toFixed(2)}</p>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground italic">Keine Artikeldetails verfügbar.</p>
                  )}
                </div>
              </div>

              <form onSubmit={submitReview} className="border-t pt-6">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold">
                  <Star className="h-4 w-4" />
                  Bestellung bewerten
                </h4>
                <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                  <label className="grid gap-1 text-xs font-bold uppercase text-muted-foreground">
                    Produkt
                    <select
                      value={reviewForm.productSlug}
                      onChange={(event) => {
                        const item = Array.isArray(selectedOrder.items)
                          ? selectedOrder.items.find((entry: any) => String(entry.productSlug ?? "") === event.target.value)
                          : null;
                        setReviewForm({
                          ...reviewForm,
                          productSlug: event.target.value,
                          productName: String(item?.name ?? item?.productName ?? "")
                        });
                      }}
                      className="h-10 rounded-md border bg-background px-3 text-sm font-semibold normal-case text-foreground"
                    >
                      {Array.isArray(selectedOrder.items) ? selectedOrder.items.map((item: any, index: number) => (
                        <option key={`${item.productSlug ?? item.name}-${index}`} value={String(item.productSlug ?? "")}>
                          {item.name || item.productName || "Produkt"}
                        </option>
                      )) : null}
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs font-bold uppercase text-muted-foreground">
                    Sterne
                    <select
                      value={reviewForm.rating}
                      onChange={(event) => setReviewForm({ ...reviewForm, rating: Number(event.target.value) })}
                      className="h-10 rounded-md border bg-background px-3 text-sm font-semibold text-foreground"
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option key={rating} value={rating}>{rating}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="mt-3 grid gap-1 text-xs font-bold uppercase text-muted-foreground">
                  Kommentar
                  <textarea
                    value={reviewForm.comment}
                    onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })}
                    className="h-24 rounded-md border bg-background p-3 text-sm font-medium normal-case text-foreground"
                    placeholder="Wie war Ihre Erfahrung?"
                    required
                    minLength={3}
                  />
                </label>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button type="submit" size="sm" disabled={submittingReview}>
                    {submittingReview ? "Speichert..." : "Bewertung senden"}
                  </Button>
                  {reviewMessage.text ? (
                    <p className={reviewMessage.type === "error" ? "text-xs font-bold text-rose-600" : "text-xs font-bold text-emerald-700"}>
                      {reviewMessage.text}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Bewertungen erscheinen erst nach Admin-Freigabe.</p>
                  )}
                </div>
              </form>

              {(selectedOrder.shippingCost || selectedOrder.processingFee) && (
                <div className="border-t pt-4 space-y-2">
                  <h4 className="text-sm font-bold">Zusatzkosten</h4>
                  <div className="space-y-1 text-sm">
                    {selectedOrder.shippingCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{selectedOrder.shippingName || "Versand"}</span>
                        <span className="font-semibold">€{Number(selectedOrder.shippingCost).toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder.processingFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bearbeitung & Verpackung</span>
                        <span className="font-semibold">€{Number(selectedOrder.processingFee).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-6 border-t pt-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-bold flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Rechnungsadresse
                  </h4>
                  <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
                    {selectedOrder.billingAddress ? (
                      <pre className="font-sans whitespace-pre-wrap">{selectedOrder.billingAddress}</pre>
                    ) : (
                      <p>Keine Rechnungsadresse hinterlegt.</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-bold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Lieferadresse
                  </h4>
                  <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
                    {selectedOrder.shippingAddress ? (
                      <pre className="font-sans whitespace-pre-wrap">{selectedOrder.shippingAddress}</pre>
                    ) : selectedOrder.billingAddress ? (
                      <pre className="font-sans whitespace-pre-wrap">{selectedOrder.billingAddress}</pre>
                    ) : (
                      <p>Keine Lieferadresse hinterlegt.</p>
                    )}
                  </div>
                </div>
              </div>

                  {selectedOrder.company && (
                <div className="border-t pt-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Firma / UST-ID</p>
                  <p className="text-sm font-semibold">{selectedOrder.company} {selectedOrder.vatId && `(${selectedOrder.vatId})`}</p>
                </div>
              )}
              {selectedOrder.email && (
                <div className="border-t pt-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Kontakt-Email</p>
                  <p className="text-sm">{selectedOrder.email}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 border-t bg-muted/30 px-6 py-4 flex justify-end">
              <Button onClick={() => setSelectedOrder(null)}>Schließen</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
