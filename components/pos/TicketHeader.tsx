"use client";

import { Button } from "@/components/ui/button";

export default function TicketHeader({
  ticketId,
  onNewTicket,
  isBusy,
}: {
  ticketId: string;
  onNewTicket: () => void;
  isBusy: boolean;
}) {
  return (
    <header className="md:col-span-2 flex items-center justify-between">
      <Button onClick={onNewTicket} disabled={isBusy} variant="outline" size="sm">
        {isBusy ? "Creating..." : "New Ticket"}
      </Button>
      <h1 className="text-xl font-semibold">Ticket {ticketId.slice(0, 8)}</h1>
      <div />
    </header>
  );
}


