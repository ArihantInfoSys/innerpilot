import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars missing, let the request through
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    // Protected routes
    const protectedPaths = ["/checkin", "/dashboard", "/history", "/settings"];
    const isProtected = protectedPaths.some((p) =>
      request.nextUrl.pathname.startsWith(p)
    );

    if (isProtected && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Auth pages redirect if logged in
    const authPaths = ["/login", "/signup"];
    const isAuthPage = authPaths.some((p) =>
      request.nextUrl.pathname.startsWith(p)
    );

    if (isAuthPage && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  } catch (e) {
    // If auth check fails, let the request through
    console.error("Middleware auth error:", e);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|api).*)"],
};
