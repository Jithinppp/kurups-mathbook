import { cn } from "@/lib/utils";

export function Logo({
  className,
  tone = "dark",
  showWordmark = true,
}: {
  className?: string;
  tone?: "dark" | "light";
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-brand">
        <svg
          viewBox="0 0 32 32"
          className="size-8"
          aria-hidden="true"
          fill="none"
        >
          <path
            d="M5.5 20.25c2.4 0 2.4-4.1 4.8-4.1s2.4 4.1 4.8 4.1 2.4-4.1 4.8-4.1 2.4 4.1 4.8 4.1 2.4-4.1 4.8-4.1"
            stroke="white"
            strokeWidth="2.15"
            strokeLinecap="round"
          />
          <circle cx="24.75" cy="11.35" r="1.55" fill="white" fillOpacity=".9" />
        </svg>
      </span>
      {showWordmark ? (
        <span
          className={cn(
            "text-[17px] font-semibold tracking-[-0.04em]",
            tone === "light" ? "text-white" : "text-ink",
          )}
        >
          Kurup
        </span>
      ) : null}
    </div>
  );
}
