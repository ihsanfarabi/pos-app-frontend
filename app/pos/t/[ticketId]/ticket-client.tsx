"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { addLine, formatIdr, getMe, getMenu, getTicket, MenuItemDto, payCash, TicketDto } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

export default function TicketClient({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [menu, setMenu] = useState<MenuItemDto[]>([]);
  const [ticket, setTicket] = useState<TicketDto | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [m, t] = await Promise.all([getMenu(), getTicket(ticketId)]);
      setMenu(m);
      setTicket(t);
      setError(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load";
      setError(message);
    }
  }, [ticketId]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        const me = await getMe();
        setRole(me.role);
      } catch {}
      await refresh();
    })();
  }, [refresh, router]);

  function onAdd(menuItemId: number) {
    startTransition(async () => {
      try {
        await addLine({ ticketId, menuItemId });
        await refresh();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to add line";
        setError(message);
      }
    });
  }

  function onPay() {
    startTransition(async () => {
      try {
        await payCash(ticketId);
        await refresh();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to pay";
        setError(message);
      }
    });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      <header className="md:col-span-2 flex items-center justify-between">
        <Link href="/pos" className="text-sm underline">New Ticket</Link>
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
              disabled={isPending || ticket?.status !== "Open"}
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
            disabled={isPending || ticket?.status !== "Open"}
            className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
          >
            Pay Cash
          </button>
          <span className="text-sm text-gray-500">Status: {ticket?.status ?? "Loading..."}</span>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
      </section>
    </div>
  );
}


