import React from "react";

export function Button({
  children,
  variant = "primary", // primary | secondary | ghost
  size = "md", // md | sm | icon
  className = "",
  ...rest
}) {
  const variantStyle =
    variant === "secondary"
      ? "bg-[var(--color-secondary)] text-[var(--color-text)] hover:bg-[var(--color-hover)]"
      : variant === "ghost"
      ? "bg-transparent hover:bg-[var(--color-hover)]"
      : "bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[var(--color-hover)]";

  const sizeStyle =
    size === "icon" ? "p-2" : size === "sm" ? "px-3 py-1 text-sm" : "px-4 py-2";

  return (
    <button
      {...rest}
      className={`rounded ${variantStyle} ${sizeStyle} disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
