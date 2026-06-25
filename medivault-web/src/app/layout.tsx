import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppDataProvider } from "@/components/app-data-provider";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MediVault",
  description: "Premium family medical report vault and health dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AppDataProvider>{children}</AppDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
