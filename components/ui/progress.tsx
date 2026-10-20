import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  indicatorClassName,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-[#ececf2]", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
    >
      <div
        className={cn(
          "h-full rounded-full bg-brand transition-[width] duration-500",
          indicatorClassName,
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
