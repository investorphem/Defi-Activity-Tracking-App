export const metadata = {
  title: "Stacks DeFi Activity Tracker",
  description: "Real-time DeFi analytics on Stacks using Hiro Chainhooks",

  icons: {
    icon: "/preview.png",
    shortcut: "/favicon.ico",
    apple: "/preview.png",
  },

  themeColor: "#0f172a",

  other: {
    "talentapp:project_verification":
      "d2deae433ba27f95c6d1d88451a5a3d0d2c99845d9ce0001772c6e297f9d99dd24e3899338ffc7df3dfa30279adc691927b847365375aa19e13bdc3b433792cf",
  },

  openGraph: {
    title: "Stacks DeFi Activity Tracker"
    description: "Real-time DeFi analytics on Stacks usinrks",
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
      <body className="p-6">{children}</body>
    </html>
  );
}