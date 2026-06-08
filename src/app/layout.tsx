import "./globals.css";

export const metadata = {
  title: "Dyoli Club",
  description: "Clube exclusivo da Dyoli",
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
