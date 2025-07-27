import React from "react";

export function Input({ className = "", ...rest }) {
  return (
    <input
      {...rest}
      className={`w-full rounded border  bg-[var(--color-bg2)] text-[var(--color-text2)] p-2 focus:border-[var(--color-primary)] focus:outline-none ${className}`}
    />
  );
}
