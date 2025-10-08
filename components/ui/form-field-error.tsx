"use client";

type Props = {
  id?: string;
  message?: string | null;
  className?: string;
};

export default function FormFieldError({ id, message, className }: Props) {
  if (!message) return null;
  return (
    <p id={id} className={["text-sm text-red-600", className ?? ""].join(" ")}>{message}</p>
  );
}


