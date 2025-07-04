import React from "react";

export function Input({ className = "", ...rest }) {
  return (
    <input
      {...rest}
      className={`w-full rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none ${className}`}
    />
  );
}