import type { Metadata } from "next";
import "./globals.scss";
import { SideNav } from "./SideNav";
import { MobileNav } from "./MobileNav";

export const metadata: Metadata = {
  title: "agent-tail",
  description: "Development logs made agent accessible.",
  openGraph: {
    title: "agent-tail",
    description: "Development logs made agent accessible.",
  },
  twitter: {
    card: "summary_large_image",
    title: "agent-tail",
    description: "Development logs made agent accessible.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Cascadia+Code:ital@1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <MobileNav />
        <SideNav />
        <main className="main-content">{children}</main>
      </body>
    </html>
  );
}
