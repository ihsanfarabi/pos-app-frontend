"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "@/lib/api";

export default function PosEntry() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { id } = await createTicket();
        router.replace(`/pos/t/${id}`);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to start ticket";
        setError(message);
      }
    })();
  }, [router]);

  return (
    <div className="p-6">
      {error ? <p className="text-red-600 text-sm">{error}</p> : <p>Loading...</p>}
    </div>
  );
}

