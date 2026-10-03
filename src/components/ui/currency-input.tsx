"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { Input } from "./input";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/currency-input";

type Props = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onChange" | "type"
> & {
  value?: string;
  defaultValue?: number | string;
  onValueChange?: (value: string) => void;
};

export function CurrencyInput({
  value,
  defaultValue = "",
  onValueChange,
  name,
  ...props
}: Props) {
  const [local, setLocal] = useState(String(defaultValue));
  const input = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);
  const raw = value ?? local;
  const formatted = formatCurrencyInput(raw);
  useLayoutEffect(() => {
    if (caret.current === null || !input.current) return;
    // Keep the cursor next to the same digit while grouping separators move.
    let position = 0,
      remaining = caret.current;
    while (position < formatted.length && remaining > 0) {
      if (/[0-9,]/.test(formatted[position])) remaining--;
      position++;
    }
    input.current.setSelectionRange(position, position);
    caret.current = null;
  });
  return (
    <>
      <Input
        {...props}
        ref={input}
        type="text"
        inputMode="decimal"
        value={formatted}
        onKeyDown={(event) => {
          props.onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const node = event.currentTarget;
          const position = node.selectionStart ?? 0;
          if (node.selectionEnd !== position) return;
          const backward =
            event.key === "Backspace" && formatted[position - 1] === ".";
          const forward = event.key === "Delete" && formatted[position] === ".";
          if (!backward && !forward) return;
          event.preventDefault();
          const start = backward ? position - 2 : position;
          const text = formatted.slice(0, start) + formatted.slice(start + 2);
          caret.current = formatted
            .slice(0, start)
            .replace(/[^0-9,]/g, "").length;
          const next = parseCurrencyInput(text);
          setLocal(next);
          onValueChange?.(next);
        }}
        onChange={(event) => {
          const text = event.target.value;
          caret.current = text
            .slice(0, event.target.selectionStart ?? text.length)
            .replace(/[^0-9,]/g, "").length;
          const next = parseCurrencyInput(text);
          setLocal(next);
          onValueChange?.(next);
        }}
      />
      {name && (
        <input
          type="hidden"
          name={name}
          value={raw}
          disabled={props.disabled}
        />
      )}
    </>
  );
}
