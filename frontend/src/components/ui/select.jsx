import React from "react";

/* Base select */
export function Select({ value, onValueChange, children, className = "", ...rest }) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={`w-full rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

/* Stub components to keep current JSX intact */
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