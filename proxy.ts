import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/editor", "/content", "/settings", "/api/content", "/api/media", "/api/auth/account", "/api/auth/me"];

export async function proxy(request: NextRequest) {
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`));
  if (!isProtected) return NextResponse.next();
  // Proxy performs only a fast optimistic cookie check. Database-backed
  // authorization is repeated in layouts and every write/read route.
  if (!request.cookies.get("ganesh_admin_session")?.value) {
    if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/editor/:path*", "/content/:path*", "/settings/:path*", "/api/content/:path*", "/api/media/:path*", "/api/auth/account", "/api/auth/me"] };
