"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type TicketDto } from "@/lib/api";

export function PaymentControls({
  ticket,
  onPay,
  onPayMockSuccess,
  onPayMockFail,
  isBusy,
}: {
  ticket: TicketDto | undefined;
  onPay: () => void;
  onPayMockSuccess: () => void;
  onPayMockFail: () => void;
  isBusy: boolean;
}) {
  const isTicketOpen = ticket?.status === "Open";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Button onClick={onPay} disabled={isBusy || !isTicketOpen}>
            Pay Cash
          </Button>
          <Button
            onClick={onPayMockSuccess}
            disabled={isBusy || !isTicketOpen}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            Pay Mock (Success)
          </Button>
          <Button
            onClick={onPayMockFail}
            disabled={isBusy || !isTicketOpen}
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            Pay Mock (Fail)
          </Button>
          <span className="text-sm text-gray-600">
            Status: <span className="font-medium">{ticket?.status ?? "Loading..."}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default PaymentControls;


