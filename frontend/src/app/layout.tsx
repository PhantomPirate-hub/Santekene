'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import HeartbeatLoader from "@/components/shared/HeartbeatLoader";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate a loading time
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="fr">
      <body className={cn("min-h-screen bg-fond-doux font-sans antialiased", inter.className)}>
        <AuthProvider>
          {loading ? <HeartbeatLoader /> : children}
        </AuthProvider>
      </body>
    </html>
  );
}
