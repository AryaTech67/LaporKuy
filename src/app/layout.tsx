import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0057B8" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  referrer: 'no-referrer',
  title: {
    default: "LaporKuy — Platform Pelaporan Infrastruktur Kota Berbasis AI",
    template: "%s | LaporKuy",
  },
  description:
    "Laporkan masalah infrastruktur kota dalam 30 detik. Foto + lokasi otomatis, AI klasifikasi, teruskan ke dinas terkait. Bantu wujudkan kota yang lebih baik.",
  keywords: [
    "lapor",
    "infrastruktur",
    "jalan rusak",
    "lampu mati",
    "sampah",
    "banjir",
    "AI",
    "pelaporan kota",
  ],
  openGraph: {
    title: "LaporKuy — Platform Pelaporan Infrastruktur Kota Berbasis AI",
    description:
      "Laporkan masalah infrastruktur kota dalam 30 detik. AI klasifikasi otomatis.",
    siteName: "LaporKuy",
    type: "website",
    locale: "id_ID",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html 
      lang="id" 
      className={`${fontSans.variable} h-full antialiased font-sans`} 
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body 
        className="min-h-full flex flex-col bg-background text-foreground dark:bg-slate-950 dark:text-slate-50 font-sans"
        suppressHydrationWarning
      >
        {/* Suppress Netlify HUD & badge */}
        <div id="nl-badge-frame" style={{ display: 'none', visibility: 'hidden', width: 0, height: 0 }} aria-hidden="true" />
        <div id="nl-hud-frame" style={{ display: 'none', visibility: 'hidden', width: 0, height: 0 }} aria-hidden="true" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{localStorage.setItem('nl-hud:public:v1','hidden');localStorage.setItem('nl-hud:owner-private:v1','hidden');}catch(e){}`,
          }}
        />
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
