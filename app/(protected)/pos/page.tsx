"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createTicket } from "@/lib/api";
import { ticketKeys } from "@/lib/query-options";
import { useApiMutation } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/components/ui/notification-provider";

export default function PosEntry() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notifySuccess } = useNotifications();

  const createTicketMutation = useApiMutation({
    mutationFn: () => createTicket(),
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.root });
      router.replace(`/pos/t/${id}`);
      notifySuccess("New ticket created");
    },
  });

  const isPending = createTicketMutation.isPending;

  function onCreate() {
    createTicketMutation.mutate();
  }

  return (
    <div className="p-6 space-y-3">
      <Button onClick={onCreate} disabled={isPending}>
        {isPending ? "Creating..." : "New Ticket"}
      </Button>
    </div>
  );
}
