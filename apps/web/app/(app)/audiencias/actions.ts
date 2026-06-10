"use server";

import { prisma } from "@legaltech/db";
import { requireSession } from "@/lib/session";
import { pushEventToGoogle, deleteEventFromGoogle } from "@/lib/google";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createHearing(formData: FormData) {
  await requireSession();

  const caseId = String(formData.get("caseId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const dateStr = String(formData.get("hearingDate") ?? "");
  if (!caseId || !name || !dateStr) throw new Error("Processo, título e data são obrigatórios");

  const hearingDate = new Date(dateStr);
  const durationHours = Number(formData.get("durationHours")) || 1;
  const caseRow = await prisma.case.findUnique({ where: { id: caseId }, select: { responsibleLawyerId: true } });

  // Cria audiência + evento de calendário vinculado (sync local audiência↔evento).
  const hearing = await prisma.hearing.create({
    data: {
      caseId,
      name,
      hearingDate,
      durationHours,
      lawyerId: caseRow?.responsibleLawyerId ?? null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      event: {
        create: {
          title: `Audiência: ${name}`,
          start: hearingDate,
          end: new Date(hearingDate.getTime() + durationHours * 3600 * 1000),
          type: "AUDIENCIA",
          caseId,
        },
      },
    },
    select: { eventId: true },
  });

  // Espelha no Google Calendar se conectado (best-effort).
  if (hearing.eventId) await pushEventToGoogle(hearing.eventId);

  revalidatePath("/audiencias");
  revalidatePath("/agenda");
  redirect("/audiencias");
}

export async function deleteHearing(id: string) {
  await requireSession();
  const h = await prisma.hearing.findUnique({
    where: { id },
    select: { eventId: true, event: { select: { googleEventId: true } } },
  });
  await prisma.hearing.delete({ where: { id } });
  if (h?.eventId) {
    await deleteEventFromGoogle(h.event?.googleEventId ?? null);
    await prisma.calendarEvent.delete({ where: { id: h.eventId } }).catch(() => {});
  }
  revalidatePath("/audiencias");
  revalidatePath("/agenda");
}
