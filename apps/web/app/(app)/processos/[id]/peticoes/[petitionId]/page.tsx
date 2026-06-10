import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@legaltech/db";
import { requireSession } from "@/lib/session";
import { PetitionGenerate } from "@/components/petition-generate";
import { DeleteButton } from "@/components/ui/delete-button";
import { saveFinalContent, finalizePetition, deletePetition } from "../actions";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

const STATE_BADGE: Record<string, string> = {
  DRAFT: "badge-muted", GENERATING: "badge-warning", GENERATED: "badge-info", REVISED: "badge-info", FINALIZED: "badge-success",
};
const STATE_LABEL: Record<string, string> = {
  DRAFT: "Rascunho", GENERATING: "Gerando", GENERATED: "Gerada", REVISED: "Revisada", FINALIZED: "Finalizada",
};

export default async function PeticaoDetalhePage({ params }: { params: Promise<{ id: string; petitionId: string }> }) {
  await requireSession();
  const { id, petitionId } = await params;
  const pet = await prisma.petition.findUnique({ where: { id: petitionId } });
  if (!pet || pet.caseId !== id) notFound();

  const finalized = pet.state === "FINALIZED";

  return (
    <div className="space-y-6">
      <Link href={`/processos/${id}/peticoes`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar às petições
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">{pet.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted">
            <span className={`badge ${STATE_BADGE[pet.state]}`}>{STATE_LABEL[pet.state]}</span>
            <span>{pet.petitionType}</span>
            {pet.aiProvider && <span>· {pet.aiProvider} {pet.aiModel}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pet.state === "DRAFT" && <PetitionGenerate petitionId={pet.id} label="Gerar com IA" />}
          {(pet.state === "GENERATED" || pet.state === "REVISED") && <PetitionGenerate petitionId={pet.id} label="Regenerar" />}
          <DeleteButton action={deletePetition.bind(null, pet.id)} iconOnly />
        </div>
      </div>

      {pet.userInstructions && (
        <div className="card p-5">
          <h2 className="mb-2 font-serif text-sm font-semibold text-foreground">Instruções</h2>
          <p className="whitespace-pre-wrap text-sm text-muted">{pet.userInstructions}</p>
        </div>
      )}

      {pet.generatedContent ? (
        <>
          <div className="card p-5">
            <h2 className="mb-3 font-serif text-base font-semibold text-foreground">Petição gerada (IA)</h2>
            <div
              className="prose-sm max-w-none space-y-2 text-sm leading-relaxed text-foreground [&_h3]:mt-4 [&_h3]:font-serif [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc"
              dangerouslySetInnerHTML={{ __html: pet.generatedContent }}
            />
          </div>

          {/* Edição da versão final */}
          <form action={saveFinalContent.bind(null, pet.id)} className="card space-y-3 p-5">
            <h2 className="font-serif text-base font-semibold text-foreground">Versão final (editável)</h2>
            <textarea
              name="finalContent"
              rows={16}
              readOnly={finalized}
              defaultValue={pet.finalContent ?? pet.generatedContent ?? ""}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 font-mono text-xs text-foreground outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
            />
            {!finalized && (
              <div className="flex items-center justify-end gap-3">
                <button className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition-colors hover:text-foreground">
                  Salvar rascunho final
                </button>
              </div>
            )}
          </form>

          {!finalized ? (
            <form action={finalizePetition.bind(null, pet.id)} className="flex justify-end">
              <button className="flex items-center gap-2 rounded-lg bg-success/15 px-5 py-2 text-sm font-semibold text-success ring-1 ring-inset ring-success/30 transition-colors hover:bg-success/25">
                <CheckCircle2 className="h-4 w-4" /> Finalizar petição
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-end gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> Petição finalizada
            </div>
          )}
        </>
      ) : (
        <div className="card p-8 text-center text-sm text-muted">
          Clique em “Gerar com IA” para produzir a petição com base no contexto do processo.
        </div>
      )}
    </div>
  );
}
