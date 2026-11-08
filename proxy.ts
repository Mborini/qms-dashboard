// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { requiredPermissionFor } from "./app/lib/modules";
import { hasPermission } from "./app/lib/permissions";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // =========================================
  // LOGIN PAGE
  // =========================================
  if (pathname === "/") {
    // مسجل دخول → Dashboard
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // غير مسجل → Login
    return NextResponse.next();
  }

  // =========================================
  // PROTECTED PAGES (لازم تسجيل دخول)
  // =========================================
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // =========================================
  // PERMISSIONS (حسب modules.ts)
  // =========================================
  const required = requiredPermissionFor(pathname);

  // مسار مش مربوط بأي كرت (مثل /dashboard) → يمر
  if (!required) {
    return NextResponse.next();
  }

  const permissions = (token.permissions as string[] | undefined) ?? [];

  // مسجل دخول لكن ما معه الصلاحية → للداشبورد
  if (!hasPermission(permissions, required)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};