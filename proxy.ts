
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // =========================
  // صفحة تسجيل الدخول /
  // =========================
  if (pathname === "/") {
    // إذا مسجل دخول → الرئيسية
    if (token) {
      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }

    // غير مسجل → يسمح له بالدخول
    return NextResponse.next();
  }

  // =========================
  // جميع الصفحات الأخرى
  // تحتاج تسجيل دخول
  // =========================
  if (!token) {
    const loginUrl = new URL("/", request.url);

    // حفظ الصفحة المطلوبة
    loginUrl.searchParams.set(
      "callbackUrl",
      pathname
    );

    return NextResponse.redirect(loginUrl);
  }

  // =========================
  // المستخدم مسجل دخول
  // =========================
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * حماية جميع الصفحات
     *
     * استثناء:
     * - API
     * - ملفات Next.js
     * - الصور
     * - favicon
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

