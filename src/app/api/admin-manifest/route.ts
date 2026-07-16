import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    name: 'Dyoli Admin',
    short_name: 'Dyoli Admin',
    description: 'Painel de Administração - Club Dyoli',
    start_url: '/admin/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#111827',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
}
