import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import { Inter, Bungee } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const bungee = Bungee({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MantineProvider>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}

export { inter, bungee };