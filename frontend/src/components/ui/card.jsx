import React from "react";

export function Card({ className = "", children, ...rest }) {
  return (
    <div
      {...rest}
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function CardContent({ className = "", children, ...rest }) {
  return (
    <div {...rest} className={`p-4 ${className}`}>
      {children}
    </div>
  );
}