import { ChevronDown } from "lucide-react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-xl border border-line bg-white text-sm text-ink outline-none transition placeholder:text-subtle focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-subtle";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, "h-11 px-3.5", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(fieldBase, "min-h-20 resize-none px-3.5 py-3", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          fieldBase,
          "h-11 appearance-none pl-3.5 pr-10",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}: {
  label?: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div className="flex items-baseline justify-between gap-3">
          <label
            htmlFor={htmlFor}
            className="text-[13px] font-medium text-ink"
          >
            {label}
          </label>
          {hint ? (
            <span className="text-[11px] text-subtle">{hint}</span>
          ) : null}
        </div>
      ) : null}
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: {
  options: { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "grid gap-1 rounded-xl bg-[rgba(148,151,169,0.1)] p-1",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-[9px] font-medium transition",
            size === "sm" ? "h-8 text-xs" : "h-9 text-[13px]",
            value === option.value
              ? "bg-white text-ink shadow-[0_1px_4px_rgba(16,24,40,0.08)]"
              : "text-muted hover:text-ink",
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
