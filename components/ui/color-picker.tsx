"use client";

import {
  DEFAULT_COLOR,
  clamp,
  hexToHsv,
  hsvToHex,
  normalizeHexColor,
  type HsvColor,
} from "@asharibook/shared";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PANEL_STEP = 0.02;
const PANEL_STEP_LARGE = 0.1;

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const initial = normalizeHexColor(value) ?? DEFAULT_COLOR;
  const [hsv, setHsv] = useState<HsvColor>(() => hexToHsv(initial));
  const [hexDraft, setHexDraft] = useState(initial);
  const [hexError, setHexError] = useState(false);
  const lastEmitted = useRef(initial);
  const dragging = useRef(false);

  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);
  const hueColor = hsvToHex(hsv.h, 1, 1);

  useEffect(() => {
    const normalized = normalizeHexColor(value);
    if (!normalized || normalized === lastEmitted.current) return;
    lastEmitted.current = normalized;
    setHsv(hexToHsv(normalized));
    setHexDraft(normalized);
    setHexError(false);
  }, [value]);

  function emit(nextHex: string) {
    const normalized = normalizeHexColor(nextHex);
    if (!normalized) return;
    lastEmitted.current = normalized;
    onChange(normalized);
  }

  function updateHsv(next: HsvColor) {
    setHsv(next);
    const nextHex = hsvToHex(next.h, next.s, next.v);
    setHexDraft(nextHex);
    setHexError(false);
    emit(nextHex);
  }

  function updateFromPointer(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    updateHsv({
      ...hsv,
      s: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      v: clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1),
    });
  }

  function handlePanelPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragging.current = true;
    updateFromPointer(event);
  }

  function handlePanelPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    updateFromPointer(event);
  }

  function handlePanelPointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    dragging.current = false;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handlePanelKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? PANEL_STEP_LARGE : PANEL_STEP;
    let next = hsv;

    if (event.key === "ArrowLeft") {
      next = { ...hsv, s: clamp(hsv.s - step, 0, 1) };
    } else if (event.key === "ArrowRight") {
      next = { ...hsv, s: clamp(hsv.s + step, 0, 1) };
    } else if (event.key === "ArrowUp") {
      next = { ...hsv, v: clamp(hsv.v + step, 0, 1) };
    } else if (event.key === "ArrowDown") {
      next = { ...hsv, v: clamp(hsv.v - step, 0, 1) };
    } else {
      return;
    }

    event.preventDefault();
    updateHsv(next);
  }

  function handleHexChange(next: string) {
    setHexDraft(next);
    const normalized = normalizeHexColor(next);
    if (!normalized) {
      setHexError(next.trim().length > 1);
      return;
    }

    setHexError(false);
    setHsv(hexToHsv(normalized));
    emit(normalized);
  }

  function handleHexBlur() {
    const normalized = normalizeHexColor(hexDraft);
    if (!normalized) {
      setHexDraft(currentHex);
      setHexError(false);
      return;
    }

    setHsv(hexToHsv(normalized));
    setHexDraft(normalized);
    setHexError(false);
    emit(normalized);
  }

  return (
    <div className="space-y-3 rounded-xl border border-line-soft bg-canvas p-3">
      <div
        role="group"
        tabIndex={0}
        aria-label="Saturation and brightness. Use the arrow keys to adjust."
        className="relative h-36 w-full cursor-crosshair overflow-hidden rounded-xl border border-line-soft outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
        style={{
          touchAction: "none",
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), ${hueColor}`,
        }}
        onPointerDown={handlePanelPointerDown}
        onPointerMove={handlePanelPointerMove}
        onPointerUp={handlePanelPointerEnd}
        onPointerCancel={handlePanelPointerEnd}
        onLostPointerCapture={() => {
          dragging.current = false;
        }}
        onKeyDown={handlePanelKeyDown}
      >
        <span
          className="pointer-events-none absolute size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_1px_5px_rgba(16,17,20,0.35),0_0_0_1px_rgba(16,17,20,0.12)]"
          style={{
            left: `clamp(9px, ${hsv.s * 100}%, calc(100% - 9px))`,
            top: `clamp(9px, ${(1 - hsv.v) * 100}%, calc(100% - 9px))`,
            backgroundColor: currentHex,
          }}
        />
      </div>

      <input
        type="range"
        min={0}
        max={360}
        step={1}
        value={Math.round(hsv.h)}
        onChange={(event) =>
          updateHsv({ ...hsv, h: Number(event.target.value) })
        }
        aria-label="Hue"
        className="color-hue-slider w-full"
      />

      <div className="flex items-center gap-2.5">
        <span
          className="size-11 shrink-0 rounded-xl border border-line-soft"
          style={{ backgroundColor: currentHex }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <Input
            value={hexDraft}
            onChange={(event) => handleHexChange(event.target.value)}
            onBlur={handleHexBlur}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            placeholder={DEFAULT_COLOR}
            aria-label="Hex colour"
            aria-invalid={hexError}
            maxLength={7}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className={cn(
              "font-mono uppercase tracking-[0.04em]",
              hexError &&
                "border-danger focus:border-danger focus:ring-danger/10",
            )}
          />
          {hexError ? (
            <p className="mt-1 text-[11px] text-danger">
              Use a hex value like #7132F5.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
