"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const router = useRouter()

  // "request" = show email form, "update" = show new password form
  const [mode, setMode] = useState<"request" | "update">("request")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // When Supabase redirects back with ?code=..., exchange it for a session
  // then switch to "update" mode so the user can set a new password
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code")
    if (!code) return

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setError("Invalid or expired reset link. Please request a new one.")
      } else {
        // Remove the code from the URL without reloading
        window.history.replaceState({}, "", "/reset-password")
        setMode("update")
      }
    })
  }, [])

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSuccess(true)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    router.push("/login?message=Password updated. Please sign in.")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg border shadow-sm p-8">

        {mode === "update" ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Set new password</h1>
            <p className="text-gray-500 mb-6">Choose a strong password for your account</p>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  suppressHydrationWarning
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  suppressHydrationWarning
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Repeat your password"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 font-medium text-sm transition-colors"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h1>
            <p className="text-gray-500 mb-6">Enter your email and we&apos;ll send you a reset link</p>

            {success ? (
              <div className="text-center py-4">
                <p className="text-green-600 font-medium">Check your email for a reset link</p>
                <Link href="/login" className="text-blue-600 hover:underline text-sm mt-4 inline-block">
                  Back to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    suppressHydrationWarning
                    className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="jane@example.com"
                  />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 font-medium text-sm transition-colors"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>

                <p className="text-center text-sm text-gray-500">
                  <Link href="/login" className="text-blue-600 hover:underline font-medium">
                    Back to sign in
                  </Link>
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
