import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  // Use the provided Supabase middleware to handle token refresh
  const supabaseResponse = createClient(request);
  
  // Create a separate client just to read the user and enforce roles
  // We don't use this one to set cookies, the one above does that
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // Ignored here, handled by supabaseResponse
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Public paths that don't need auth
  if (
    path === "/" ||
    path.startsWith("/_next") || 
    path.startsWith("/api/tiles") ||
    path.startsWith("/auth") || 
    path === "/login" || 
    path === "/dev-login" ||
    path === "/register" ||
    path === "/public" ||
    path.startsWith("/public/") ||
    path === "/report" ||
    path === "/advisories" ||
    path === "/public-map" ||
    path === "/public-advisories" ||
    path.startsWith("/api/public/") ||
    path.startsWith("/api/reports")
  ) {
    return supabaseResponse;
  }

  // If no user, redirect to login based on path
  if (!user) {
    if (path.startsWith("/dev-") || path === "/users" || path === "/demo" || path === "/config") {
      return NextResponse.redirect(new URL("/dev-login", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Fetch user role
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "public";

  // Route protection
  if ((path.startsWith("/dev-") || path === "/users" || path === "/demo" || path === "/config") && role !== "developer") {
    return NextResponse.redirect(new URL("/dashboard", request.url)); // redirect to officer
  }

  // Note: /dashboard, /map, /assets, etc. are under (officer) route group
  // We'll protect these endpoints
  const officerPaths = ["/dashboard", "/map", "/assets", "/rainfall", "/events", "/alerts", "/reports", "/flags", "/advisories", "/audit", "/settings"];
  const isOfficerPath = officerPaths.some(p => path === p || path.startsWith(`${p}/`));
  
  if (isOfficerPath && role === "public") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
