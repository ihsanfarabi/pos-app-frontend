"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createMenuItem, deleteMenuItem, MenuItemDto, updateMenuItem, formatIdr } from "@/lib/api";
import { DataTable, type ColumnDef } from "@/components/data-table";
import { useUrlPaging } from "@/lib/url-paging";
import { menuKeys } from "@/lib/query-options";
import { useApiMutation, useMenuPaged } from "@/lib/hooks";
import type { ValidationErrors } from "@/lib/http";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/components/ui/notification-provider";
import FormErrorSummary from "@/components/ui/form-error-summary";

type Editing = { id?: string; name: string; price: number } | null;

export default function AdminMenuPage() {
  const { page, pageSize, q, setState } = useUrlPaging({ page: 1, pageSize: 20, q: "" });
  const [editing, setEditing] = useState<Editing>(null);
  const [qDraft, setQDraft] = useState(q);
  const [formErrors, setFormErrors] = useState<ValidationErrors | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);
  const { notifySuccess } = useNotifications();

  useEffect(() => {
    setQDraft(q);
  }, [q]);

  const filters = useMemo(() => ({ page, pageSize, q }), [page, pageSize, q]);
  const menuQuery = useMenuPaged(filters);
  const queryClient = useQueryClient();

  const handleValidationError = useCallback((errors: ValidationErrors | null) => {
    setFormErrors(errors);
  }, []);

  const handleErrorMessage = useCallback((message: string | null) => {
    if (!message) {
      setFormError(null);
      setTraceId(null);
      return;
    }
    setFormError(message);
  }, []);

  function validate(payload: { name: string; price: number }): boolean {
    const next: ValidationErrors = {};
    const name = payload.name.trim();
    if (!name) {
      next.name = ["Name is required."];
    } else if (name.length > 200) {
      next.name = ["Name must be at most 200 characters."];
    }
    if (!Number.isFinite(payload.price) || payload.price <= 0) {
      next.price = ["Price must be greater than 0."];
    }
    const has = Object.keys(next).length > 0;
    setFormErrors(has ? next : null);
    if (!has) {
      setFormError(null);
      setTraceId(null);
    }
    return !has;
  }

  const createMutation = useApiMutation({
    mutationFn: (dto: { name: string; price: number }) =>
      createMenuItem({ name: dto.name.trim(), price: dto.price }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all() });
      notifySuccess("Menu item created");
    },
    onValidationError: handleValidationError,
    onErrorMessage: handleErrorMessage,
    disableErrorToast: true,
    onError: (error: unknown) => {
      if (error && typeof error === "object" && "traceId" in error) {
        const t = (error as { traceId?: unknown }).traceId;
        if (typeof t === "string") setTraceId(t);
      }
    },
  });

  const updateMutation = useApiMutation({
    mutationFn: (payload: { id: string; name: string; price: number }) =>
      updateMenuItem(payload.id, {
        name: payload.name.trim(),
        price: payload.price,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all() });
      notifySuccess("Menu item updated");
    },
    onValidationError: handleValidationError,
    onErrorMessage: handleErrorMessage,
    disableErrorToast: true,
    onError: (error: unknown) => {
      if (error && typeof error === "object" && "traceId" in error) {
        const t = (error as { traceId?: unknown }).traceId;
        if (typeof t === "string") setTraceId(t);
      }
    },
  });

  const deleteMutation = useApiMutation({
    mutationFn: (id: string) => deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all() });
      notifySuccess("Menu item deleted");
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  function onStartCreate() {
    setEditing({ name: "", price: 0 });
    setFormErrors(null);
    setFormError(null);
    setTraceId(null);
  }

  function onStartEdit(item: MenuItemDto) {
    setEditing({ id: item.id, name: item.name, price: item.price });
    setFormErrors(null);
    setFormError(null);
    setTraceId(null);
  }

  function onCancel() {
    setEditing(null);
    setFormErrors(null);
    setFormError(null);
    setTraceId(null);
  }

  function onChange(field: keyof NonNullable<Editing>, value: string) {
    setEditing((prev) =>
      prev
        ? {
            ...prev,
            [field]: field === "price" ? Number(value) : value,
          }
        : prev,
    );
    setFormError(null);
    setTraceId(null);
    setFormErrors((prev) => {
      if (!prev) return prev;
      if (!(field in prev)) return prev;
      const rest: Record<string, unknown> = { ...prev };
      delete rest[field as string];
      return Object.keys(rest).length === 0 ? null : (rest as ValidationErrors);
    });
  }

  function onSave() {
    if (!editing) return;
    const payload = { ...editing, name: editing.name.trim() };
    if (!validate({ name: payload.name, price: payload.price })) return;
    if (payload.id != null) {
      updateMutation.mutate(
        { id: payload.id, name: payload.name, price: payload.price },
        {
          onSuccess: () => {
            setEditing(null);
            setFormErrors(null);
            setFormError(null);
            setTraceId(null);
          },
        },
      );
    } else {
      createMutation.mutate(
        { name: payload.name, price: payload.price },
        {
          onSuccess: () => {
            setEditing(null);
            setFormErrors(null);
            setFormError(null);
            setTraceId(null);
          },
        },
      );
    }
  }

  const onDelete = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ page: 1, q: qDraft });
  }

  function onPageChange(nextPage: number) {
    setState({ page: nextPage });
  }

  function onPageSizeChange(newSize: number) {
    setState({ page: 1, pageSize: newSize });
  }

  const columns: ColumnDef<MenuItemDto, unknown>[] = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "name",
        cell: ({ row }) => <span>{row.original.name}</span>,
      },
      {
        header: "Price",
        accessorKey: "price",
        cell: ({ row }) => <span>{formatIdr(row.original.price)}</span>,
      },
      {
        header: "Actions",
        id: "actions",
        cell: ({ row }) => (
          <div className="text-right space-x-2">
            <button onClick={() => onStartEdit(row.original)} className="rounded border px-2 py-1">
              Edit
            </button>
            <button
              onClick={() => onDelete(row.original.id)}
              disabled={isDeleting}
              className="rounded border px-2 py-1 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [isDeleting, onDelete],
  );

  const totalItems = menuQuery.data?.count ?? 0;
  const currentPage = (menuQuery.data?.pageIndex ?? page - 1) + 1;
  const currentPageSize = menuQuery.data?.pageSize ?? pageSize;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Admin: Menu</h1>
        <form onSubmit={onSearch} className="flex items-center gap-2">
          <Input
            placeholder="Search..."
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
          />
          <Button variant="outline" type="submit" size="sm">
            Search
          </Button>
        </form>
        <div className="flex items-center gap-2">
          <Button onClick={onStartCreate} size="sm">
            New Item
          </Button>
        </div>
      </div>

      {editing && (
        <div className="rounded border p-4 space-y-3">
          <FormErrorSummary message={formError} traceId={traceId} />
          <div className="grid gap-2">
            <label className="text-sm">Name</label>
            <Input
              value={editing.name}
              onChange={(e) => onChange("name", e.target.value)}
              aria-invalid={!!formErrors?.name}
            />
            {formErrors?.name && formErrors.name[0] && (
              <p className="text-sm text-red-600">{formErrors.name[0]}</p>
            )}
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Price</label>
            <Input
              type="number"
              value={editing.price}
              onChange={(e) => onChange("price", e.target.value)}
              aria-invalid={!!formErrors?.price}
            />
            {formErrors?.price && formErrors.price[0] && (
              <p className="text-sm text-red-600">{formErrors.price[0]}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button disabled={isSaving} onClick={onSave}>
              Save
            </Button>
            <Button disabled={isSaving} onClick={onCancel} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={menuQuery.data?.data ?? []}
        page={currentPage}
        pageSize={currentPageSize}
        total={totalItems}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={menuQuery.isFetching}
      />
    </div>
  );
}
