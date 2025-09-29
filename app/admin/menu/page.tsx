"use client";

import { useEffect, useState, useTransition } from "react";
import { createMenuItem, deleteMenuItem, getMe, getMenu, MenuItemDto, updateMenuItem } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

type Editing = { id?: number; name: string; price: number } | null;

export default function AdminMenuPage() {
  const router = useRouter();
  const [items, setItems] = useState<MenuItemDto[]>([]);
  const [editing, setEditing] = useState<Editing>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    const list = await getMenu();
    setItems(list);
  }

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        const me = await getMe();
        if (me.role !== "admin") {
          router.replace("/pos");
          return;
        }
        await refresh();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load";
        setError(message);
      }
    })();
  }, [router]);

  function onStartCreate() {
    setEditing({ name: "", price: 0 });
  }

  function onStartEdit(item: MenuItemDto) {
    setEditing({ id: item.id, name: item.name, price: item.price });
  }

  function onCancel() {
    setEditing(null);
  }

  function onChange(field: keyof NonNullable<Editing>, value: string) {
    setEditing((prev) => (prev ? { ...prev, [field]: field === "price" ? Number(value) : value } as Editing : prev));
  }

  function onSave() {
    if (!editing) return;
    startTransition(async () => {
      try {
        if (editing.id != null) {
          await updateMenuItem(String(editing.id), { name: editing.name.trim(), price: editing.price });
        } else {
          await createMenuItem({ name: editing.name.trim(), price: editing.price });
        }
        setEditing(null);
        await refresh();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to save";
        setError(message);
      }
    });
  }

  function onDelete(id: number) {
    startTransition(async () => {
      try {
        await deleteMenuItem(String(id));
        await refresh();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to delete";
        setError(message);
      }
    });
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin: Menu</h1>
        <button onClick={onStartCreate} className="rounded bg-black text-white px-3 py-2 text-sm">New Item</button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {editing && (
        <div className="rounded border p-4 space-y-3">
          <div className="grid gap-2">
            <label className="text-sm">Name</label>
            <input className="border rounded-md h-10 px-3 text-sm" value={editing.name} onChange={(e) => onChange("name", e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Price</label>
            <input type="number" className="border rounded-md h-10 px-3 text-sm" value={editing.price} onChange={(e) => onChange("price", e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <button disabled={isPending} onClick={onSave} className="rounded bg-black text-white px-3 py-2 text-sm disabled:opacity-50">Save</button>
            <button disabled={isPending} onClick={onCancel} className="rounded border px-3 py-2 text-sm disabled:opacity-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="rounded border divide-y">
        <div className="grid grid-cols-4 px-3 py-2 text-sm font-medium bg-gray-50">
          <div className="col-span-2">Name</div>
          <div className="text-right">Price</div>
          <div className="text-right">Actions</div>
        </div>
        {items.map((it) => (
          <div key={it.id} className="grid grid-cols-4 px-3 py-2 text-sm items-center">
            <div className="col-span-2">{it.name}</div>
            <div className="text-right">{new Intl.NumberFormat("id-ID").format(it.price)}</div>
            <div className="text-right space-x-2">
              <button onClick={() => onStartEdit(it)} className="rounded border px-2 py-1">Edit</button>
              <button onClick={() => onDelete(it.id)} className="rounded border px-2 py-1">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


