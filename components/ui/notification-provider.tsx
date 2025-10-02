"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

const DEFAULT_DISMISS_MS = 5000;

type NotificationType = "info" | "success" | "error" | "warning";

type Notification = {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  dismissAfter?: number;
};

type NotifyOptions = {
  type?: NotificationType;
  title?: string;
  message: string;
  dismissAfter?: number;
};

type NotificationContextValue = {
  notify: (options: NotifyOptions) => string;
  notifyError: (message: string, options?: Omit<NotifyOptions, "message" | "type">) => string;
  notifySuccess: (message: string, options?: Omit<NotifyOptions, "message" | "type">) => string;
  dismiss: (id: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

function generateId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const notify = useCallback((options: NotifyOptions) => {
    const id = generateId();
    const next: Notification = {
      id,
      type: options.type ?? "info",
      title: options.title,
      message: options.message,
      dismissAfter: options.dismissAfter ?? DEFAULT_DISMISS_MS,
    };

    setNotifications((prev) => [...prev, next]);

    if (next.dismissAfter && next.dismissAfter > 0) {
      window.setTimeout(() => {
        dismiss(id);
      }, next.dismissAfter);
    }

    return id;
  }, [dismiss]);

  const notifyError = useCallback(
    (message: string, options?: Omit<NotifyOptions, "message" | "type">) =>
      notify({ ...options, message, type: "error" }),
    [notify],
  );

  const notifySuccess = useCallback(
    (message: string, options?: Omit<NotifyOptions, "message" | "type">) =>
      notify({ ...options, message, type: "success" }),
    [notify],
  );

  const value = useMemo<NotificationContextValue>(
    () => ({ notify, notifyError, notifySuccess, dismiss }),
    [notify, notifyError, notifySuccess, dismiss],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:justify-end">
        <div className="flex w-full max-w-sm flex-col gap-3">
          {notifications.map((notification) => (
            <Toast
              key={notification.id}
              notification={notification}
              onDismiss={() => dismiss(notification.id)}
            />
          ))}
        </div>
      </div>
    </NotificationContext.Provider>
  );
}

function Toast({ notification, onDismiss }: { notification: Notification; onDismiss: () => void }) {
  const tone = getTone(notification.type);

  return (
    <div
      className={`pointer-events-auto rounded-md border px-4 py-3 shadow-md transition ${tone.container}`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
        <div className="flex-1">
          {notification.title && (
            <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
          )}
          <p className="text-sm text-gray-800">{notification.message}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-2 text-sm text-gray-500 transition hover:text-gray-900"
          aria-label="Dismiss notification"
        >
          x
        </button>
      </div>
    </div>
  );
}

function getTone(type: NotificationType) {
  switch (type) {
    case "success":
      return {
        container: "border-green-200 bg-white/95 backdrop-blur",
        dot: "bg-green-500",
      } as const;
    case "error":
      return {
        container: "border-red-200 bg-white/95 backdrop-blur",
        dot: "bg-red-500",
      } as const;
    case "warning":
      return {
        container: "border-amber-200 bg-white/95 backdrop-blur",
        dot: "bg-amber-500",
      } as const;
    default:
      return {
        container: "border-gray-200 bg-white/95 backdrop-blur",
        dot: "bg-gray-400",
      } as const;
  }
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

