import Link from "next/link";
import { prisma } from "@legaltech/db";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { Field, TextArea, FormActions } from "@/components/ui/form";
import { saveFirm } from "./actions";
import { ArrowLeft, Building2, MapPin, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EscritorioConfigPage() {
  await requireRole("ADMIN_ESCRITORIO");
  const firm = await prisma.firm.findUnique({ where: { id: "firm" } });
  const social = (firm?.socialLinks ?? {}) as { instagram?: string; linkedin?: string; facebook?: string };

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/config" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar às configurações
      </Link>
      <PageHeader title="Dados do escritório" subtitle="Identidade, endereço e conteúdo do site público" />

      <form action={saveFirm} className="space-y-6">
        {/* Identidade */}
        <div className="card space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-serif text-base font-semibold text-foreground">
            <Building2 className="h-4 w-4 text-gold" /> Identidade
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do escritório" name="name" required defaultValue={firm?.name ?? ""} />
            <Field label="Razão social" name="legalName" defaultValue={firm?.legalName ?? ""} />
            <Field label="CNPJ" name="cnpj" defaultValue={firm?.cnpj ?? ""} />
            <Field label="Inscrição OAB" name="oab" defaultValue={firm?.oab ?? ""} />
            <Field label="E-mail" name="email" type="email" defaultValue={firm?.email ?? ""} />
            <Field label="Telefone" name="phone" defaultValue={firm?.phone ?? ""} />
            <Field label="WhatsApp (só dígitos, com DDI)" name="whatsapp" defaultValue={firm?.whatsapp ?? ""} />
          </div>
        </div>

        {/* Endereço */}
        <div className="card space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-serif text-base font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-gold" /> Endereço
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Logradouro" name="street" defaultValue={firm?.street ?? ""} />
            <Field label="Número" name="number" defaultValue={firm?.number ?? ""} />
            <Field label="Complemento" name="complement" defaultValue={firm?.complement ?? ""} />
            <Field label="Bairro" name="district" defaultValue={firm?.district ?? ""} />
            <Field label="Cidade" name="city" defaultValue={firm?.city ?? ""} />
            <Field label="UF" name="state" defaultValue={firm?.state ?? ""} />
            <Field label="CEP" name="zip" defaultValue={firm?.zip ?? ""} />
            <Field label="Link do Google Maps" name="mapsUrl" defaultValue={firm?.mapsUrl ?? ""} />
          </div>
        </div>

        {/* Website */}
        <div className="card space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-serif text-base font-semibold text-foreground">
            <Globe className="h-4 w-4 text-gold" /> Site público
          </h2>
          <Field label="Slogan (tagline)" name="tagline" defaultValue={firm?.tagline ?? ""} />
          <Field label="Título do hero" name="heroTitle" defaultValue={firm?.heroTitle ?? ""} />
          <TextArea label="Subtítulo do hero" name="heroSubtitle" defaultValue={firm?.heroSubtitle ?? ""} rows={2} />
          <Field label="Título da seção “Sobre”" name="aboutTitle" defaultValue={firm?.aboutTitle ?? ""} />
          <TextArea label="Texto “Sobre”" name="aboutBody" defaultValue={firm?.aboutBody ?? ""} rows={4} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Instagram" name="instagram" defaultValue={social.instagram ?? ""} />
            <Field label="LinkedIn" name="linkedin" defaultValue={social.linkedin ?? ""} />
            <Field label="Facebook" name="facebook" defaultValue={social.facebook ?? ""} />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="siteActive" defaultChecked={firm?.siteActive ?? true} className="h-4 w-4 rounded border-border bg-bg accent-gold" />
            Site público ativo
          </label>
        </div>

        <FormActions cancelHref="/config" submitLabel="Salvar dados do escritório" />
      </form>
    </div>
  );
}
