import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Unprotected public assets and endpoints
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/models") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/favicon.ico" ||
    pathname === "/offline" ||
    pathname.startsWith("/dev");

  if (isPublicAsset) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;
  const userRole = request.cookies.get("pw_role")?.value?.toLowerCase();
  const isDemo = request.cookies.get("pw_demo")?.value === "true";

  const isAuthenticated = Boolean(accessToken || isDemo);
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // 2. Handle Root ("/") Navigation
  if (pathname === "/") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (userRole === "student") {
      return NextResponse.redirect(new URL("/student", request.url));
    }
    if (userRole === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Unauthenticated requests trying to access protected routes
  if (!isAuthenticated && !isAuthPage && pathname !== "/welcome") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("return_to", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Authenticated users trying to access /login or /register
  if (isAuthenticated && isAuthPage) {
    if (userRole === "student") {
      return NextResponse.redirect(new URL("/student", request.url));
    }
    if (userRole === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 5. Role-based Route Protection
  if (isAuthenticated) {
    // Student Role Protection: cannot access manager analytics, logs, forecasting, or admin
    if (userRole === "student") {
      const isAllowedForStudent =
        pathname.startsWith("/student") ||
        pathname.startsWith("/help") ||
        pathname.startsWith("/about");

      if (!isAllowedForStudent) {
        return NextResponse.redirect(new URL("/student", request.url));
      }
    }

    // Manager / Demo Protection: cannot access platform admin consoles
    if (userRole !== "admin" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
