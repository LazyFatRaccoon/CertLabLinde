import React from "react";

export function Button({
  children,
  variant = "primary", // primary | secondary | ghost
  size = "md",         // md | sm | icon
  className = "",
  ...rest
}) {
  const variantStyle =
    variant === "secondary"
      ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
      : variant === "ghost"
      ? "bg-transparent hover:bg-gray-100"
      : "bg-blue-600 text-white hover:bg-blue-700";

  const sizeStyle =
    size === "icon"
      ? "p-2"
      : size === "sm"
      ? "px-3 py-1 text-sm"
      : "px-4 py-2";

  return (
    <button
      {...rest}
      className={`rounded ${variantStyle} ${sizeStyle} disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}