import './globals.css';

export const metadata = {
  title: 'NetArchitect: Algorithmic Network Planning & Self-Explaining Architecture Engine',
  description: 'Production-quality network planning and explainable decision engine for enterprise architectures, VLSM allocations, and Cisco IOS configurations.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0A0A0A] text-[#EDEDED] min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}

