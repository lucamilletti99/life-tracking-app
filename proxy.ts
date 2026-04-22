import { NextResponse, type NextRequest } from "next/server";

import { resolvePostLoginPath } from "@/lib/auth/session";
import { updateSession } from "@/supabase/proxy";

const LOGIN_PATH = "/login";
const CALLBACK_PATH = "/auth/callback";
const PROTECTED_PREFIXES = ["/calendar", "/goals", "/habits", "/analytics"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value, ...cookie }) => {
    to.cookies.set(name, value, cookie);
  });
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { response, user } = await updateSession(request);

  const isProtected = isProtectedPath(pathname);
  const isLoginRoute = pathname === LOGIN_PATH;
  const isCallbackRoute = pathname === CALLBACK_PATH;

  if (!user && isProtected) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);

    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  if (user && isLoginRoute) {
    const next = resolvePostLoginPath(request.nextUrl.searchParams.get("next"));
    const redirectResponse = NextResponse.redirect(new URL(next, request.url));
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  if (isCallbackRoute) {
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/calendar/:path*",
    "/goals/:path*",
    "/habits/:path*",
    "/analytics/:path*",
    "/login",
    "/auth/callback",
  ],
};
