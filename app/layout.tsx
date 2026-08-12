import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LifeLens — Your health story, remembered",
  description: "A calm, private health memory for you and your family.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
