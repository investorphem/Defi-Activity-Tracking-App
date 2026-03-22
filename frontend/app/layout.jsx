import "./globals.css"; // Ensure your Tailwind styles are imported

export const viewport = {
  themeColor: "#0f172a",
};

export const metadata = {
  title: "Stacks DeFi Activity Tracker",
  description: "Real-time DeFi analytics on Stacks using Hiro Chainhooks",
  metadataBase: new URL("https://defiactivitytracker.vercel.app/"), // Important for relative image paths

  icons: {
    icon: "/preview.png",
    shortcut: "/favicon.ico",
    apple: "/preview.png",
  },

  other: {
    "talentapp:project_verification":
      "d2deae433ba27f95c6d1d88451a5a3d0d2c99845d9ce0001772c6e297f9d99dd24e3899338ffc7df3dfa30279adc691927b847365375aa19e13bdc3b433792cf",
  },

  openGraph: {
    title: "Stacks DeFi Activity Tracker",
    description: "Real-time DeFi analytics on Stacks using Hiro Chainhooks",
    url: "https://defiactivitytracker.vercel.app/",
    siteName: "Stacks DeFi Activity Tracker",
    images: [
      {
        url: "/preview.png",
        width: 1200,
        height: 630,
        alt: "Stacks DeFi Tracker Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Stacks DeFi Activity Tracker",
    description: "Real-time DeFi analytics on Stacks",
    images: ["/preview.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* Added min-h-screen and a dark-friendly background 
        to match your #0f172a theme color 
      */}
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-orange-100 selection:text-orange-900">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </body>
    </html>
  );
}
