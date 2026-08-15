import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const BASE =
  "group/btn inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap " +
  "transition-colors duration-150 ease-[var(--ease)] disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-invert text-on-invert hover:opacity-90",
  secondary: "border border-line text-ink hover:border-line-strong hover:bg-raised",
  ghost: "text-muted hover:text-ink hover:bg-raised",
  danger: "border border-line text-critical hover:border-critical/40 hover:bg-critical/10",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

/** The arrow nudges up and right on hover — the site's one shared button gesture. */
export function Arrow() {
  return (
    <span
      aria-hidden
      className="translate-y-0 transition-transform duration-150 ease-[var(--ease)] group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5"
    >
      ↗
    </span>
  );
}

export const buttonStyles = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  cn(BASE, VARIANTS[variant], SIZES[size], className);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", arrow = false, className, type = "button", children, ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonStyles(variant, size, className)} {...props}>
      {children}
      {arrow ? <Arrow /> : null}
    </button>
  );
});

/**
 * The same button for anything the router should not own: in-page anchors and
 * links off the site. Off-site destinations open in a new tab; anchors do not.
 */
export function ButtonAnchor({
  variant = "secondary",
  size = "md",
  arrow = false,
  className,
  children,
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: Size; arrow?: boolean }) {
  const offSite = href?.startsWith("http") ?? false;
  return (
    <a
      href={href}
      className={buttonStyles(variant, size, className)}
      {...(offSite ? { target: "_blank", rel: "noreferrer" } : {})}
      {...props}
    >
      {children}
      {arrow ? <Arrow /> : null}
    </a>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  children,
  ...props
}: LinkProps & { variant?: Variant; size?: Size; arrow?: boolean }) {
  return (
    <Link className={buttonStyles(variant, size, className)} {...props}>
      {children}
      {arrow ? <Arrow /> : null}
    </Link>
  );
}
