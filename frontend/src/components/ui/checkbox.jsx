import React from "react";

export function Checkbox({ checked, onCheckedChange, className = "", ...rest }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className={`h-4 w-4 accent-blue-600 ${className}`}
      {...rest}
    />
  );
}