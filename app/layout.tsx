import "./globals.css";

export const metadata = {
  title: "UGC Tracker",
  description: "TikTok UGC campaign tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
