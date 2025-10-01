"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createTicket } from "@/lib/api";
import { ticketKeys } from "@/lib/query-options";
import { useApiMutation } from "@/lib/hooks";

export default function PosEntry() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const createTicketMutation = useApiMutation({
    mutationFn: () => createTicket(),
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.root });
      router.replace(`/pos/t/${id}`);
    },
    onErrorMessage: setError,
  });

  const isPending = createTicketMutation.isPending;

  function onCreate() {
    setError(null);
    createTicketMutation.mutate(undefined, {
      onError: (e) => {
        const message = e instanceof Error ? e.message : "Failed to start ticket";
        setError(message);
      },
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
