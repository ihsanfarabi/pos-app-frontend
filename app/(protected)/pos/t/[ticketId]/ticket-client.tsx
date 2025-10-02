"use client";

import { useQueryClient } from "@tanstack/react-query";
import { addLine, createTicket, formatIdr, payCash } from "@/lib/api";
import { ticketKeys } from "@/lib/query-options";
import { useApiMutation, useMenuList, useTicketDetail } from "@/lib/hooks";
import { useRouter } from "next/navigation";

export default function TicketClient({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const menuQuery = useMenuList();
  const ticketQuery = useTicketDetail(ticketId);

  const addLineMutation = useApiMutation({
    mutationFn: (menuItemId: number) => addLine({ ticketId, menuItemId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) }),
  });

  const payCashMutation = useApiMutation({
    mutationFn: () => payCash(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.root });
    },
  });

  const newTicketMutation = useApiMutation({
    mutationFn: () => createTicket(),
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.root });
      router.replace(`/pos/t/${id}`);
    },
  });

  const isBusy =
    addLineMutation.isPending || payCashMutation.isPending || newTicketMutation.isPending;

  async function onAdd(menuItemId: number) {
    try {
      await addLineMutation.mutateAsync(menuItemId);
    } catch {
      // error handled via useApiMutation
    }
  }

  async function onPay() {
    try {
      await payCashMutation.mutateAsync();
    } catch {
      // error handled via useApiMutation
    }
  }

  async function onNewTicket() {
    try {
      await newTicketMutation.mutateAsync();
    } catch {
      // error handled via useApiMutation
    }
  }

  const menu = menuQuery.data ?? [];
  const ticket = ticketQuery.data;

  return (
    <div className="p-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      <header className="md:col-span-2 flex items-center justify-between">
        <button
          onClick={onNewTicket}
          disabled={isBusy}
          className="text-sm rounded border px-3 py-1 disabled:opacity-50"
        >
          New Ticket
        </button>
        <h1 className="text-xl font-semibold">Ticket {ticketId.slice(0, 8)}</h1>
        <div />
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Menu</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {menu.map((m) => (
            <button
              key={m.id}
              onClick={() => onAdd(m.id)}
              disabled={isBusy || ticket?.status !== "Open"}
              className="rounded border px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="font-medium">{m.name}</div>
              <div className="text-sm text-gray-600">{formatIdr(m.price)}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Ticket</h2>
        <div className="rounded border divide-y">
          <div className="grid grid-cols-5 px-3 py-2 text-sm font-medium bg-gray-50">
            <div className="col-span-2">Item</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Unit</div>
            <div className="text-right">Line</div>
          </div>
          {ticket?.lines.map((l) => (
            <div key={l.id} className="grid grid-cols-5 px-3 py-2 text-sm">
              <div className="col-span-2">{l.itemName}</div>
              <div className="text-right">{l.qty}</div>
              <div className="text-right">{formatIdr(l.unitPrice)}</div>
              <div className="text-right">{formatIdr(l.lineTotal)}</div>
            </div>
          ))}
          <div className="grid grid-cols-5 px-3 py-2 text-sm font-semibold bg-gray-50">
            <div className="col-span-4 text-right">Total</div>
            <div className="text-right">{formatIdr(ticket?.total ?? 0)}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onPay}
            disabled={isBusy || ticket?.status !== "Open"}
            className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
          >
            Pay Cash
          </button>
          <span className="text-sm text-gray-500">Status: {ticket?.status ?? "Loading..."}</span>
        </div>
      </section>
    </div>
  );
}
