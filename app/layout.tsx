import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { NotificationProvider } from "@/components/ui/notification-provider";
import { AuthProvider } from "@/lib/auth-context";
import { AppQueryProvider } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "POS App",
  description: "Point of Sale Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppQueryProvider>
          <NotificationProvider>
            <AuthProvider>
              <Navbar />
              {children}
            </AuthProvider>
          </NotificationProvider>
        </AppQueryProvider>
      </body>
    </html>
  );
}
