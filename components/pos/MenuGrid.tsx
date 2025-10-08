"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type MenuItemDto, formatIdr } from "@/lib/api";

export default function MenuGrid({
  menu,
  onAdd,
  isBusy,
  isTicketOpen,
}: {
  menu: MenuItemDto[];
  onAdd: (id: string) => void;
  isBusy: boolean;
  isTicketOpen: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu</CardTitle>
      </CardHeader>
      <CardContent>
        {menu.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">No menu items available</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {menu.map((m) => (
              <Button
                key={m.id}
                onClick={() => onAdd(m.id)}
                disabled={isBusy || !isTicketOpen}
                variant="outline"
                className="h-auto p-3 flex flex-col items-start text-left"
              >
                <div className="font-medium">{m.name}</div>
                <div className="text-sm text-gray-600">{formatIdr(m.price)}</div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MenuGridSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[64px] rounded-md border animate-pulse bg-muted" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


