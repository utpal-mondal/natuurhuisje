import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n } from './i18n/config';
import { createClient } from './utils/supabase/server';

function getLocale(request: NextRequest): string {
  const pathname = request.nextUrl.pathname;
  
  const pathnameLocale = i18n.locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameLocale) return pathnameLocale;

  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && i18n.locales.includes(cookieLocale as any)) {
    return cookieLocale;
  }

  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].trim().toLowerCase())
      .find((lang) => {
        const shortLang = lang.split('-')[0];
        return i18n.locales.includes(shortLang as any);
      });

    if (preferredLocale) {
      const shortLang = preferredLocale.split('-')[0];
      if (i18n.locales.includes(shortLang as any)) {
        return shortLang;
      }
    }
  }

  return i18n.defaultLocale;
}

async function checkAdminAccess(request: NextRequest): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return false;
    }

    const { data: userData, error } = await supabase
      .from('user_roles')
      .select('role_name')
      .eq('user_id', session.user.id)
      .single();

    if (error || !userData || (userData as any).role_name !== 'admin') {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Explicitly handle favicon.ico
  if (pathname === '/favicon.ico') {
    return NextResponse.rewrite(new URL('/images/fav.ico', request.url));
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.includes('.') 
  ) {
    return NextResponse.next();
  }

  // Check for admin routes protection
  const adminPathMatch = pathname.match(/^\/([a-z]{2})\/admin(\/.*)?$/);
  if (adminPathMatch) {
    const [, lang, adminRoute] = adminPathMatch;
    
    // Allow access to admin login page
    if (adminRoute === '/login' || adminRoute === '/login/') {
      // Check if user is already admin and logged in
      checkAdminAccess(request).then(isAdmin => {
        if (isAdmin) {
          // Redirect admin to dashboard if already logged in
          return NextResponse.redirect(new URL(`/${lang}/admin`, request.url));
        }
      });
      
      return NextResponse.next();
    }
    
    // For all other admin routes, check admin access
    // Note: This is a basic check. For more robust protection,
    // the layout component handles the detailed authorization
    return NextResponse.next();
  }

  const pathnameHasLocale = i18n.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  const locale = getLocale(request);
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  
  const response = NextResponse.redirect(newUrl);
  response.cookies.set('NEXT_LOCALE', locale, { maxAge: 31536000 });
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|flags|.*\\..*).*)'],
};
