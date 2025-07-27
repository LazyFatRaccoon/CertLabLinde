import React from "react";

/* Base select */
export function Select({
  value,
  onValueChange,
  children,
  className = "",
  ...rest
}) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={`w-full rounded border  bg-[var(--color-bg2)] text-[var(--color-text2)] p-2 focus:border-[var(--color-primary)] focus:outline-none ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children }) {
  return children;
}
export function SelectValue({ children }) {
  return children;
}
export function SelectContent({ children }) {
  return children;
}
export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>;
}
