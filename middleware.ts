import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/", "/login"]);

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith("/auth/");
}

function loginRedirect(request: NextRequest, error?: string) {
  const login = new URL("/login", request.url);
  if (request.nextUrl.pathname !== "/login") {
    login.searchParams.set("next", request.nextUrl.pathname);
  }
  if (error) login.searchParams.set("error", error);
  return NextResponse.redirect(login);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const publicPath = isPublicPath(request.nextUrl.pathname);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Keep the landing and login pages reachable when production auth is being
  // configured. Protected pages still fail closed.
  if (!url || !key) {
    return publicPath ? response : loginRedirect(request, "configuration");
  }

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(items) {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const { data, error } = await supabase.auth.getClaims();
    if (error) console.warn("auth.middleware_claims_failed", { message: error.message });

    const signedIn = Boolean(data?.claims?.sub);
    if (!signedIn && !publicPath) return loginRedirect(request);
    if (signedIn && request.nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  } catch (error) {
    console.error("auth.middleware_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return publicPath ? response : loginRedirect(request, "configuration");
  }
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
