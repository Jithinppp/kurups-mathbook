import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "white";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:bg-brand-dark",
  secondary:
    "bg-[rgba(148,151,169,0.11)] text-ink hover:bg-[rgba(148,151,169,0.18)]",
  outline:
    "border border-brand-dark bg-white text-brand-dark hover:bg-brand-soft",
  ghost: "text-muted hover:bg-black/[0.045] hover:text-ink",
  danger: "bg-danger text-white hover:bg-[#b42318]",
  white:
    "border border-line-soft bg-white text-ink shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:bg-canvas",
};

const sizes: Record<Size, string> = {
  sm: "h-9 rounded-[10px] px-3 text-[13px]",
  md: "h-11 rounded-xl px-4 text-sm",
  lg: "h-12 rounded-xl px-5 text-[15px]",
  icon: "h-10 w-10 rounded-xl p-0",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
