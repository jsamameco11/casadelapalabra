"use client";

import { useState, type InputHTMLAttributes } from "react";

export function PasswordInput({
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`w-full rounded-full border border-border bg-background px-5 py-3 pr-12 text-sm outline-none focus:border-primary ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground"
      >
        {visible ? (
          <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path
              d="M2.5 10.5S5.5 5 10 5s7.5 5.5 7.5 5.5-3 5.5-7.5 5.5S2.5 10.5 2.5 10.5Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="10.5" r="2.2" />
            <path d="M3.5 3.5l13 13" strokeLinecap="round" />
          </svg>
        ) : (
          <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path
              d="M1.5 10S4.5 4.5 10 4.5s8.5 5.5 8.5 5.5-3 5.5-8.5 5.5S1.5 10 1.5 10Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="10" r="2.5" />
          </svg>
        )}
      </button>
    </div>
  );
}
