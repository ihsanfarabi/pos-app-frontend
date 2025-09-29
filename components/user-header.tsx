"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMe } from "@/lib/api";
import { getToken } from "@/lib/auth";

export function UserHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    (async () => {
      try {
        const me = await getMe();
        setEmail(me.email);
        setRole(me.role);
      } catch {}
    })();
  }, []);

  const isAuthed = !!email;

  return (
    <div className="flex items-center justify-end gap-3 text-sm">
      {isAuthed ? (
        <>
          {role === "admin" && (
            <Link href="/admin/menu" className="underline">Admin</Link>
          )}
          <span className="text-gray-600">{email}</span>
          <span className="rounded border px-2 py-0.5 text-xs text-gray-700">{role}</span>
          <Link href="/logout" className="underline">Logout</Link>
        </>
      ) : (
        <Link href="/login" className="underline">Login</Link>
      )}
    </div>
  );
}


