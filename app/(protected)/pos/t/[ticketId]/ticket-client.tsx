"use client";

import { useQueryClient } from "@tanstack/react-query";
import { addLine, createTicket, payCash, payMock, type MenuItemDto, type TicketDto } from "@/lib/api";
import { ticketKeys } from "@/lib/query-options";
import { useApiMutation, useMenuList, useTicketDetail } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import TicketLines, { TicketLinesSkeleton } from "@/components/pos/TicketLines";
import PaymentControls from "@/components/pos/PaymentControls";
import TicketHeader from "@/components/pos/TicketHeader";
import MenuGrid, { MenuGridSkeleton } from "@/components/pos/MenuGrid";
import { useNotifications } from "@/components/ui/notification-provider";

export default function TicketClient({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notifySuccess } = useNotifications();

  const menuQuery = useMenuList();
  const ticketQuery = useTicketDetail(ticketId);

  const addLineMutation = useApiMutation({
    mutationFn: (menuItemId: string) => addLine({ ticketId, menuItemId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      notifySuccess("Item added to ticket");
    },
  });

  const payCashMutation = useApiMutation({
    mutationFn: () => payCash(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.root });
      notifySuccess("Payment successful");
    },
  });

  const newTicketMutation = useApiMutation({
    mutationFn: () => createTicket(),
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.root });
      router.replace(`/pos/t/${id}`);
      notifySuccess("New ticket created");
    },
  });

  const payMockSuccessMutation = useApiMutation({
    mutationFn: () => payMock(ticketId, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.root });
      notifySuccess("Mock payment succeeded");
    },
  });

  const payMockFailMutation = useApiMutation({
    mutationFn: () => payMock(ticketId, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.root });
    },
  });

  const isBusy =
    addLineMutation.isPending ||
    payCashMutation.isPending ||
    payMockSuccessMutation.isPending ||
    payMockFailMutation.isPending ||
    newTicketMutation.isPending;

  function onAdd(menuItemId: string) {
    addLineMutation.mutate(menuItemId);
  }

  function onPay() {
    payCashMutation.mutate();
  }

  function onPayMockSuccess() {
    payMockSuccessMutation.mutate();
  }

  function onPayMockFail() {
    payMockFailMutation.mutate();
  }

  function onNewTicket() {
    newTicketMutation.mutate();
  }

  const menu = (menuQuery.data ?? []) as MenuItemDto[];
  const ticket = ticketQuery.data as TicketDto | undefined;

  return (
    <div className="p-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      <TicketHeader ticketId={ticketId} onNewTicket={onNewTicket} isBusy={isBusy} />
      {menuQuery.isPending ? (
        <MenuGridSkeleton />
      ) : (
        <MenuGrid menu={menu} onAdd={onAdd} isBusy={isBusy} isTicketOpen={ticket?.status === "Open"} />
      )}
      <div className="space-y-3">
        {ticketQuery.isPending ? <TicketLinesSkeleton /> : <TicketLines ticket={ticket} />}
        <PaymentControls
          ticket={ticket}
          onPay={onPay}
          onPayMockSuccess={onPayMockSuccess}
          onPayMockFail={onPayMockFail}
          isBusy={isBusy}
        />
      </div>
    </div>
  );
}
