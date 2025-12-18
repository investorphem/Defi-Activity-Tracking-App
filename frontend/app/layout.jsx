export const metadata = {
  title: 'Stacks DeFi Activity Tracker',
  description: 'Real-time DeFi analytics on Stacks using Hiro Chainhooks',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="p-6">
        {children}
      </body>
    </html>
  );
}