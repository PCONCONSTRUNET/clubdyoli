import "./globals.css";

export const metadata = {
  title: "Club Dyoli",
  description: "Clube exclusivo da Dyoli",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Club Dyoli",
  },
};

export const viewport = {
  themeColor: "#ff1493",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
