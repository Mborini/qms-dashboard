import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // =========================================
  // LOGIN PAGE
  // /
  // =========================================
  if (pathname === "/") {
    // مسجل دخول → Home
    if (token) {
      return NextResponse.redirect(
        new URL("/home", request.url)
      );
    }

    // غير مسجل → خليه على Login
    return NextResponse.next();
  }

  // =========================================
  // PROTECTED PAGES
  // =========================================

  // غير مسجل دخول → Login /
  if (!token) {
    return NextResponse.redirect(
      new URL("/", request.url)
    );
  }

  // مسجل دخول → يسمح بالصفحة
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};