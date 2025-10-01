import TicketClient from "./ticket-client";

export default async function TicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  return <TicketClient ticketId={ticketId} />;
}

