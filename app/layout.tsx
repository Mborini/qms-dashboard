
import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import { Inter, Bungee } from "next/font/google";
import type { Viewport } from "next";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const bungee = Bungee({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <MantineProvider>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}

export { inter, bungee };

