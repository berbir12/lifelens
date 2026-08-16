import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://lifelens.bitlabsbuild.com"),
  applicationName: "LifeLens",
  title: { default: "LifeLens | Personal Health Record & Family Health Organizer", template: "%s | LifeLens" },
  description: "Organize medications, appointments, medical documents, health history, and family check-ins in one private personal health record.",
  alternates: { canonical: "/" },
  category: "health",
  creator: "LifeLens",
  publisher: "LifeLens",
  keywords: ["personal health record", "health record organizer", "medication tracker", "medical document organizer", "family health organizer", "health timeline"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "LifeLens — Your health story, remembered",
    description: "Organize medications, appointments, medical documents, health history, and family check-ins in one private record.",
    type: "website",
    url: "/",
    siteName: "LifeLens",
    images: [{ url: "/lifelens-card.jpg?v=2", width: 1200, height: 630, alt: "LifeLens — Your health story, remembered" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LifeLens — Your health story, remembered",
    description: "Organize medications, appointments, medical documents, health history, and family check-ins in one private record.",
    images: [{ url: "/lifelens-card.jpg?v=2", alt: "LifeLens — Your health story, remembered" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}<Analytics/><SpeedInsights/></body></html>;
}
