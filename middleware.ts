import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareSupabase } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
    const { supabase, response } = createMiddlewareSupabase(request);
    await supabase.auth.getSession();

    // If going to dashboard and not logged in, redirect to login
    if (request.nextUrl.pathname.startsWith("/dashboard") && !supabase.auth.getUser()) {
        return NextResponse.redirect(new URL("/login", request.nextUrl))
    }

    // If going to home, redirect to dashboard if logged in
    if (request.nextUrl.pathname === "/") {
        if (!!supabase.auth.getUser()) {
            return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
        }
        return NextResponse.redirect(new URL("/login", request.nextUrl));
    }

    return response;
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
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
