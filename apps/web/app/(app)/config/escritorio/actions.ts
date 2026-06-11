"use server";

import { prisma } from "@legaltech/db";
import { requireRole } from "@/lib/session";
import { revalidatePath } from "next/cache";

const str = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v || null;
};

export async function saveFirm(formData: FormData) {
  await requireRole("ADMIN_ESCRITORIO");

  const data = {
    name: String(formData.get("name") ?? "").trim() || "Escritório",
    legalName: str(formData, "legalName"),
    cnpj: str(formData, "cnpj"),
    oab: str(formData, "oab"),
    email: str(formData, "email"),
    phone: str(formData, "phone"),
    whatsapp: str(formData, "whatsapp"),
    street: str(formData, "street"),
    number: str(formData, "number"),
    complement: str(formData, "complement"),
    district: str(formData, "district"),
    city: str(formData, "city"),
    state: str(formData, "state"),
    zip: str(formData, "zip"),
    mapsUrl: str(formData, "mapsUrl"),
    tagline: str(formData, "tagline"),
    heroTitle: str(formData, "heroTitle"),
    heroSubtitle: str(formData, "heroSubtitle"),
    aboutTitle: str(formData, "aboutTitle"),
    aboutBody: str(formData, "aboutBody"),
    socialLinks: {
      instagram: String(formData.get("instagram") ?? "").trim() || undefined,
      linkedin: String(formData.get("linkedin") ?? "").trim() || undefined,
      facebook: String(formData.get("facebook") ?? "").trim() || undefined,
    },
    siteActive: formData.get("siteActive") === "on",
  };

  await prisma.firm.upsert({
    where: { id: "firm" },
    update: data,
    create: { id: "firm", ...data },
  });

  revalidatePath("/config/escritorio");
  revalidatePath("/"); // website público
  revalidatePath("/dashboard");
}
