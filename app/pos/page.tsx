import { redirect } from "next/navigation";
import { createTicket } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function PosEntry() {
  const { id } = await createTicket();
  redirect(`/pos/t/${id}`);
}


