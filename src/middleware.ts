import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // Cria um cliente Supabase com acesso aos cookies da requisição (sem localStorage)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Lê a sessão via cookies — não toca em localStorage
  const { data: { session } } = await supabase.auth.getSession();

  // ── Proteção do painel do cliente (/painel/*) ──
  if (pathname.startsWith('/painel')) {
    if (!session) {
      // Guarda destino para redirecionar após login
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Proteção do painel admin (/admin/dashboard/*) ──
  if (pathname.startsWith('/admin/dashboard')) {
    if (!session) {
      // Sem sessão → vai para o login admin
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Verifica role 'admin' diretamente no banco (uma query leve, só para admins)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      // Sessão válida mas não é admin → desloga e redireciona
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return response;
}

// Rotas que passam pelo middleware
export const config = {
  matcher: [
    '/painel/:path*',
    '/admin/dashboard/:path*',
  ],
};
