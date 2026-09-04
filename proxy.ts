import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // صفحة تسجيل الدخول
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(
        new URL("/Home", request.url)
      );
    }

    return NextResponse.next();
  }

  // كل الصفحات الأخرى محمية
  if (!token) {
    const loginUrl = new URL("/", request.url);

    loginUrl.searchParams.set(
      "callbackUrl",
      pathname
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};