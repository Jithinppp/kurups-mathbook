"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog-panel"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => onOpenChange(false)}
      onClick={(event) => {
        if (event.target === ref.current) onOpenChange(false);
      }}
    >
      <div
        className={cn(
          "dialog-card flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[560px] flex-col overflow-hidden rounded-[22px] bg-white",
          "shadow-[0_24px_80px_rgba(16,17,20,0.2)]",
          "max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none max-sm:rounded-t-[24px]",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
          <div>
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-[-0.02em] text-ink"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="-mr-1 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-black/[0.05] hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 thin-scrollbar sm:px-6 sm:py-6">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-line-soft bg-white px-5 py-3.5 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
