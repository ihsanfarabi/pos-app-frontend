"use client";

import React from "react";

type Props = {
  message?: string | null;
  traceId?: string | null;
  className?: string;
};

export function FormErrorSummary({ message, traceId, className }: Props) {
  if (!message && !traceId) return null;
  return (
    <div className={"rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800 " + (className ?? "")}> 
      {message && <p>{message}</p>}
      {traceId && (
        <p className="mt-1 opacity-80">Support code: {traceId}</p>
      )}
    </div>
  );
}

export default FormErrorSummary;


