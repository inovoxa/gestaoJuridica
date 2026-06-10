import { SiteNavbar } from "@/components/site/navbar";
import { SiteFooter } from "@/components/site/footer";
import { getFirm } from "@/lib/session";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const firm = await getFirm();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNavbar firmName={firm?.name ?? "Advocacia"} />
      <div className="flex-1">{children}</div>
      <SiteFooter firm={firm} />
    </div>
  );
}
