import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh overflow-hidden bg-white lg:grid lg:grid-cols-[1.03fr_0.97fr]">
      <aside className="relative hidden overflow-hidden bg-brand p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="pointer-events-none absolute -right-32 -top-44 size-[560px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-10 -top-20 size-[320px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-56 -left-40 size-[520px] rounded-full border border-white/10" />

        <div className="relative">
          <Logo tone="light" />
        </div>

        <div className="relative my-auto max-w-[520px] py-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            Personal finance, without the spreadsheet
          </p>
          <h1 className="mt-4 text-[46px] font-semibold leading-[1.04] tracking-[-0.05em] xl:text-[54px]">
            Every dirham,
            <br />
            accounted for.
          </h1>
          <p className="mt-5 max-w-md text-[14px] leading-relaxed text-white/70">
            Cards, cash, budgets and the month ahead in one calm view. Know where
            you stand before the statement arrives.
          </p>

          <div className="relative mt-10 max-w-[430px]">
            <div className="rounded-[22px] bg-white p-5 text-ink shadow-[0_28px_70px_rgba(35,10,90,0.28)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">
                    Net position
                  </p>
                  <p className="mt-1 text-[26px] font-semibold tracking-[-0.04em]">
                    AED 35,569.55
                  </p>
                </div>
                <Badge variant="brand">Sample</Badge>
              </div>
              <div className="mt-5 flex h-[86px] items-end gap-2">
                {[42, 55, 48, 70, 62, 88].map((height, index) => (
                  <div key={index} className="flex h-full flex-1 items-end gap-1">
                    <div
                      className="w-full rounded-t-[4px] bg-brand"
                      style={{ height: `${height}%` }}
                    />
                    <div
                      className="w-full rounded-t-[4px] bg-success/30"
                      style={{ height: `${Math.max(22, height - 24)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-3 border-t border-line-soft pt-4">
                <MockRow label="Dining" value="AED 1,020" percent={146} danger />
                <MockRow label="Groceries" value="AED 723" percent={80} />
                <MockRow label="Rent" value="AED 5,200" percent={100} />
              </div>
            </div>
            <div className="absolute -bottom-5 -right-4 rounded-xl border border-white/20 bg-white px-3.5 py-2.5 text-ink shadow-[0_14px_30px_rgba(35,10,90,0.22)]">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-subtle">
                This month
              </p>
              <p className="mt-0.5 text-[13px] font-semibold text-success-dark">
                + AED 3,310 kept
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-between border-t border-white/15 pt-5 text-[11px] text-white/50">
          <span>Built for the month ahead.</span>
          <span>AED · UAE</span>
        </div>
      </aside>

      <main className="flex h-dvh min-h-0 flex-col overflow-y-auto px-5 py-6 sm:px-8 lg:px-12">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
        <div className="flex items-center justify-between gap-4 text-[10px] text-subtle">
          <span>AshariBook · Personal finance</span>
          <span className="hidden sm:inline">Private by design</span>
        </div>
      </main>
    </div>
  );
}

function MockRow({
  label,
  value,
  percent,
  danger = false,
}: {
  label: string;
  value: string;
  percent: number;
  danger?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-medium text-ink">{label}</span>
        <span className="tabular text-subtle">{value}</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line-soft">
        <div
          className={danger ? "h-full rounded-full bg-danger" : "h-full rounded-full bg-brand"}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
