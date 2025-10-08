"use client";

import { type TicketDto } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIdr } from "@/lib/api";

export function TicketLines({ ticket }: { ticket: TicketDto | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        {(!ticket || ticket.lines.length === 0) ? (
          <div className="p-6 text-center text-muted-foreground">No items in this ticket</div>
        ) : (
          <div className="rounded border divide-y">
            <div className="grid grid-cols-5 px-3 py-2 text-sm font-medium bg-gray-50">
              <div className="col-span-2">Item</div>
              <div className="text-right">Qty</div>
              <div className="text-right">Unit</div>
              <div className="text-right">Line</div>
            </div>
            {ticket.lines.map((l) => (
              <div key={l.id} className="grid grid-cols-5 px-3 py-2 text-sm">
                <div className="col-span-2">{l.itemName}</div>
                <div className="text-right">{l.qty}</div>
                <div className="text-right">{formatIdr(l.unitPrice)}</div>
                <div className="text-right">{formatIdr(l.lineTotal)}</div>
              </div>
            ))}
            <div className="grid grid-cols-5 px-3 py-2 text-sm font-semibold bg-gray-50">
              <div className="col-span-4 text-right">Total</div>
              <div className="text-right">{formatIdr(ticket.total)}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TicketLinesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded border divide-y">
          <div className="grid grid-cols-5 px-3 py-2 text-sm font-medium bg-gray-50">
            <div className="col-span-2">Item</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Unit</div>
            <div className="text-right">Line</div>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 px-3 py-2 text-sm">
              <div className="col-span-2 h-4 rounded bg-muted animate-pulse" />
              <div className="h-4 rounded bg-muted animate-pulse" />
              <div className="h-4 rounded bg-muted animate-pulse" />
              <div className="h-4 rounded bg-muted animate-pulse" />
            </div>
          ))}
          <div className="grid grid-cols-5 px-3 py-2 text-sm font-semibold bg-gray-50">
            <div className="col-span-4 text-right">Total</div>
            <div className="text-right h-4 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TicketLines;


