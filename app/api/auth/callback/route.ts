import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")
  const next = searchParams.get("next") ?? "/dashboard"

  // OAuth provider returned an error (e.g. user denied access, or Supabase
  // failed to exchange the code with the provider)
  if (error) {
    const loginUrl = new URL("/login", origin)
    loginUrl.searchParams.set("error", errorDescription ?? error)
    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      const loginUrl = new URL("/login", origin)
      loginUrl.searchParams.set("error", exchangeError.message)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.redirect(new URL(next, origin))
  }

  // No code and no error — something unexpected
  return NextResponse.redirect(new URL("/login", origin))
}
