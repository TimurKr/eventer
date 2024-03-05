import { createMiddlewareSupabase } from "@/utils/supabase/middleware";
import { Route } from "next";
import { NextResponse, type NextRequest } from "next/server";

type ExhaustiveRoute = Route | `${Route}/*`;

const authenticatedHomeRoute: Route = "/dashboard";
const loginRoute: Route = "/login";

const protectedRoutes: ExhaustiveRoute[] = ["/dashboard/*"];
const onlyPublicRoutes: ExhaustiveRoute[] = ["/login", "/signup"];
const redirects: Record<string, Route> = {
  "/": "/dashboard",
  "/dashboard": "/dashboard/services",
};

function pathInExhaustiveRoutes(route: string, routes: ExhaustiveRoute[]) {
  return routes.some(
    (exhaustiveRoute) =>
      (exhaustiveRoute.endsWith("/*") &&
        route.startsWith(exhaustiveRoute.slice(0, -2))) ||
      route === exhaustiveRoute,
  );
}

function redirect(path: Route, request: NextRequest) {
  return NextResponse.redirect(new URL(path, request.nextUrl));
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareSupabase(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (
    !session &&
    pathInExhaustiveRoutes(request.nextUrl.pathname, protectedRoutes)
  ) {
    return redirect(loginRoute, request);
  }
  if (
    !!session &&
    pathInExhaustiveRoutes(request.nextUrl.pathname, onlyPublicRoutes)
  ) {
    return redirect(authenticatedHomeRoute, request);
  }

  for (const [from, to] of Object.entries(redirects)) {
    if (
      pathInExhaustiveRoutes(request.nextUrl.pathname, [
        from as ExhaustiveRoute,
      ])
    ) {
      return redirect(to, request);
    }
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
