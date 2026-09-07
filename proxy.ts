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
  // الصفحة الرئيسية /
  // =========================================
  if (pathname === "/") {
    // يوجد Token → Dashboard
    if (token) {
      return NextResponse.redirect(
        new URL("/home", request.url)
      );
    }

    // لا يوجد Token → Login
    return NextResponse.next();
  }

  // =========================================
  // جميع الصفحات الأخرى محمية
  // =========================================
  if (!token) {
    const loginUrl = new URL("/", request.url);

    // الصفحة التي حاول الوصول إليها
    loginUrl.searchParams.set(
      "callbackUrl",
      pathname
    );

    return NextResponse.redirect(loginUrl);
  }

  // =========================================
  // المستخدم مسجل دخول
  // =========================================
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};