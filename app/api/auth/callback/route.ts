import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")
  const next = searchParams.get("next") ?? "/dashboard"

  // OAuth provider returned an error (e.g. user denied access)
  if (error) {
    const loginUrl = new URL("/login", origin)
    loginUrl.searchParams.set("error", errorDescription ?? error)
    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const cookieStore = await cookies()

    // Build the redirect response FIRST so we can attach Set-Cookie headers
    // to it. Using cookies() alone (next/headers) does NOT automatically
    // propagate cookie writes to a NextResponse.redirect() response.
    const redirectUrl = new URL(next, origin)
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            // Write cookies onto the actual redirect response so the browser
            // receives the session immediately after the OAuth exchange.
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      const loginUrl = new URL("/login", origin)
      loginUrl.searchParams.set("error", exchangeError.message)
      return NextResponse.redirect(loginUrl)
    }

    return response
  }

  // No code and no error — something unexpected
  return NextResponse.redirect(new URL("/login", origin))
}
