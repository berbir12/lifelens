import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://lifelens.bitlabsbuild.com"),
  title: "LifeLens — Your health story, remembered",
  description: "A calm, private health memory for you and your family.",
  icons: { icon: "/icon.svg" },
  openGraph: { title: "LifeLens — Your health story, remembered", description: "A private timeline for health records, memories, and family support.", type: "website" },
  twitter: {
    card: "summary_large_image",
    title: "LifeLens — Your health story, remembered",
    description: "A private timeline for health records, memories, and family support.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}<Analytics/><SpeedInsights/></body></html>;
}
