import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-xl border border-line bg-raised px-3.5 text-sm text-ink placeholder:text-subtle " +
  "transition-colors duration-150 ease-[var(--ease)] focus:border-line-strong focus:outline-none " +
  "disabled:text-subtle";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(CONTROL, "h-11", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref,
) {
  return <select ref={ref} className={cn(CONTROL, "h-11 pr-8", className)} {...props} />;
});

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();

  return (
    <div>
      <label className="mb-2 block text-[13px] text-muted" htmlFor={id}>
        {label}
      </label>
      {children(id)}
      {error ? (
        <p className="mt-2 text-[13px] text-critical">{error}</p>
      ) : hint ? (
        <p className="mt-2 text-[13px] text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export function Checkbox({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();

  return (
    <div className="flex items-center gap-2.5">
      <input id={id} type="checkbox" className="size-4 rounded border-line-strong accent-[var(--positive)]" {...props} />
      <label htmlFor={id} className="text-sm text-ink">
        {label}
      </label>
    </div>
  );
}

/** Segmented control used for library filters and page-level tabs. */
export function TabList({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[13px] transition-colors duration-150 ease-[var(--ease)]",
              selected
                ? "border-transparent bg-invert text-on-invert"
                : "border-line text-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
