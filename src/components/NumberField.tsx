import React, { useEffect, useRef, useState } from "react";

interface NumberFieldProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Permit a leading minus, for fields like a situational bonus. */
  allowNegative?: boolean;
  className?: string;
  title?: string;
}

// A numeric input that can actually be emptied while you retype it.
//
// The obvious `parseInt(e.target.value) || fallback` traps you: clearing the
// box parses to NaN, snaps back to the fallback, and leaves a digit you can
// never delete. So the box keeps its own draft string — free to be empty or
// half-typed — and only settles to a clamped number when you leave it.
//
// It is type="text" with a numeric inputMode rather than type="number": that
// keeps the phone keypad, but hands us the raw string, which type="number"
// hides (it reports "" for partial input like "-").
export const NumberField: React.FC<NumberFieldProps> = ({
  value,
  onChange,
  min,
  max,
  allowNegative = false,
  className,
  title,
}) => {
  const [draft, setDraft] = useState(() => String(value));
  const isFocused = useRef(false);

  // Follow changes from elsewhere (switching character, say) but never yank
  // the text out from under someone mid-edit.
  useEffect(() => {
    if (!isFocused.current) setDraft(String(value));
  }, [value]);

  const clamp = (n: number) => {
    let result = n;
    if (min !== undefined) result = Math.max(result, min);
    if (max !== undefined) result = Math.min(result, max);
    return result;
  };

  const handleChange = (raw: string) => {
    const allowed = allowNegative ? /^-?\d*$/ : /^\d*$/;
    if (!allowed.test(raw)) return;

    setDraft(raw);

    // Report only real numbers as you type, so live readouts (save DCs,
    // concentration totals) keep up. Clamping waits for blur so that typing
    // the "2" of "25" is not rewritten under your fingers.
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed)) onChange(parsed);
  };

  const handleBlur = () => {
    isFocused.current = false;
    const parsed = Number.parseInt(draft, 10);
    // Left empty? Keep the last good value rather than inventing one.
    const settled = clamp(Number.isNaN(parsed) ? value : parsed);
    setDraft(String(settled));
    onChange(settled);
  };

  return (
    <input
      type="text"
      inputMode={allowNegative ? "text" : "numeric"}
      pattern={allowNegative ? "-?[0-9]*" : "[0-9]*"}
      value={draft}
      title={title}
      onFocus={(e) => {
        isFocused.current = true;
        e.target.select();
      }}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      className={className}
    />
  );
};
