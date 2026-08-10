import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 " +
  "disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "bg-surface text-ink border border-line hover:border-line-strong hover:bg-sunken",
  ghost: "text-muted hover:text-ink hover:bg-sunken",
  danger: "bg-critical-soft text-critical border border-critical/25 hover:bg-critical hover:text-on-accent",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export const buttonStyles = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  cn(BASE, VARIANTS[variant], SIZES[size], className);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={buttonStyles(variant, size, className)} {...props} />;
});

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonStyles(variant, size, className)} {...props} />;
}
