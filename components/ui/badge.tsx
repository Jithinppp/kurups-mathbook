import { cn } from "@/lib/utils";

type Variant = "neutral" | "success" | "danger" | "warning" | "brand";

const styles: Record<Variant, string> = {
  neutral: "bg-[rgba(104,107,130,0.12)] text-[#484b5e]",
  success: "bg-success/15 text-success-dark",
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
  brand: "bg-brand/10 text-brand",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold leading-none",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
