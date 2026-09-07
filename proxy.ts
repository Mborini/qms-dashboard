import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // ================================
  // صفحة تسجيل الدخول
  // ================================
  if (pathname === "/") {
    // إذا المستخدم مسجل دخول
    // حوّله إلى Dashboard
    if (token) {
      return NextResponse.redirect(
        new URL("/home", request.url)
      );
    }

    return NextResponse.next();
  }

  // ================================
  // الصفحات الأخرى محمية
  // ================================
  if (!token) {
    const loginUrl = new URL("/", request.url);

    loginUrl.searchParams.set(
      "callbackUrl",
      pathname
    );

    return NextResponse.redirect(loginUrl);
  }

  // المستخدم مسجل دخول
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};