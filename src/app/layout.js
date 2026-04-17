export const metadata = {
  title: "Ironclad Fleet Intelligence",
  description: "Vendor cost audit and equipment intelligence platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          body { background: #f0f1f5; font-family: 'Nunito Sans', -apple-system, sans-serif; }
          .ic-btn { transition: all .15s ease !important; }
          .ic-btn:active { transform: scale(0.96) !important; opacity: 0.85 !important; }
          .ic-btn:hover { filter: brightness(1.05); }
          select { -webkit-appearance: none; appearance: none; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #d5d8e0; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: #b0b5c0; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
