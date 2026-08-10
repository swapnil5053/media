import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-subtle " +
  "transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 " +
  "disabled:bg-sunken disabled:text-subtle";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(CONTROL, "h-10", className)} {...props} />;
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
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {children(id)}
      {error ? (
        <p className="mt-1.5 text-[13px] text-critical">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export function Checkbox({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();

  return (
    <div className="flex items-center gap-2.5">
      <input
        id={id}
        type="checkbox"
        className="size-4 rounded border-line-strong text-accent accent-[var(--accent)]"
        {...props}
      />
      <label htmlFor={id} className="text-sm text-ink">
        {label}
      </label>
    </div>
  );
}

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref,
) {
  return <select ref={ref} className={cn(CONTROL, "h-10 pr-8", className)} {...props} />;
});
