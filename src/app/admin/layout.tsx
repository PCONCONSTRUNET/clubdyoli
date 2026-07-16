export const metadata = {
  title: "Dyoli Admin",
  description: "Painel de Administração - Club Dyoli",
  manifest: "/api/admin-manifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "Dyoli Admin",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
