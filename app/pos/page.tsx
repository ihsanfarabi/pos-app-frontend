"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "@/lib/api";

export default function PosEntry() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onCreate() {
    startTransition(async () => {
      try {
        const { id } = await createTicket();
        router.replace(`/pos/t/${id}`);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to start ticket";
        setError(message);
      }
    });
  }

  return (
    <div className="p-6 space-y-3">
      <button
        onClick={onCreate}
        disabled={isPending}
        className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
      >
        {isPending ? "Creating..." : "New Ticket"}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}

