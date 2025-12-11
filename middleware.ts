import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Verifica se as credenciais estão configuradas
  // Em produção, você pode adicionar validação mais robusta aqui
  const apiKey = process.env.MGC_API_KEY;
  const tenantId = process.env.MGC_TENANT_ID;

  // Permite acesso à página de auth mesmo sem credenciais
  if (request.nextUrl.pathname === '/auth') {
    return NextResponse.next();
  }

  // Se não houver credenciais, redireciona para auth
  if (!apiKey || !tenantId) {
    if (request.nextUrl.pathname !== '/auth') {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

