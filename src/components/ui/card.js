import React from "react";

// Card wrapper component
export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl border bg-white text-black shadow ${className}`}>
      {children}
    </div>
  );
}

// CardContent for inner padding
export function CardContent({ children, className = "" }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}