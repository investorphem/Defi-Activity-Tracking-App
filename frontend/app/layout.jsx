import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";

// Professional sans-serif for body and a bold display font for numbers/headers
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const viewport = {
  themeColor: "#020617", // Deeper, more modern midnight blue
};

export const metadata = {
  title: {
    default: "Stacks DeFi | Activity Tracker",
    template: "%s | Stacks DeFi"
  },
  description: "Real-time DeFi analytics on Stacks using Hiro Chainhooks",
  metadataBase: new URL("https://defiactivitytracker.vercel.app/"),
  icons: {
    icon: "/preview.png",
    shortcut: "/favicon.ico",
    apple: "/preview.png",
  },
  other: {
    "talentapp:project_verification": "d2deae433ba27f95c6d1d88451a5a3d0d2c99845d9ce0001772c6e297f9d99dd24e3899338ffc7df3dfa30279adc691927b847365375aa19e13bdc3b433792cf",
  },
  openGraph: {
    title: "Stacks DeFi Activity Tracker",
    description: "Real-time DeFi analytics on Stacks using Hiro Chainhooks",
    url: "https://defiactivitytracker.vercel.app/",
    siteName: "Stacks DeFi Tracker",
    images: [{ url: "/preview.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stacks DeFi Activity Tracker",
    images: ["/preview.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-[#020617] text-slate-200 antialiased selection:bg-orange-500/30`}>
        
        {/* Modern Background: Subtle mesh gradient and grid */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-orange-600/10 blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
        </div>

        {/* Global Navigation Bar */}
        <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20">
                S
              </div>
              <span className="font-space font-bold tracking-tight text-xl hidden sm:block">
                Stacks<span className="text-orange-500">Analytics</span>
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-500">Live Mainnet</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto p-6 md:p-10 min-h-screen">
          {children}
        </main>

        {/* Minimalist Footer */}
        <footer className="border-t border-white/5 py-12 bg-[#010409]">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-sm italic">
              Data sourced via Hiro Chainhooks & Stacks API
            </p>
            <div className="flex gap-6 text-sm font-medium text-slate-400">
              <a href="#" className="hover:text-orange-500 transition-colors">Documentation</a>
              <a href="#" className="hover:text-orange-500 transition-colors">GitHub</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
