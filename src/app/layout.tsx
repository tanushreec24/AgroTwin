import "~/styles/globals.css";

import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "~/components/ui/sonner";

export const metadata: Metadata = {
  title: "FarmSimulation",
  description: "Sprout Smarter, Grow Greener.",
  icons: "/icon.svg",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <TRPCReactProvider>
          {children}
          <Toaster
            position="top-left"
            expand={true}
            className="!z-40 !border-[#15803d] !bg-white !py-0"
          />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
