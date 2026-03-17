"use client"

import { Suspense, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
    general?: string
  }>({})
  const [loading, setLoading] = useState(false)

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    setLoading(false)

    if (error) {
      setErrors({ general: error.message })
      return
    }

    if (!data.session) {
      setErrors({ general: "Please check your email to confirm your account, then sign in." })
      return
    }

    router.push("/onboarding")
  }

  async function handleGoogleSignup() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
      },
    })
  }

  return (
    <div className="flex min-h-screen w-full flex-col font-sans bg-gray-50 text-gray-900">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 px-6 lg:px-10 py-4 bg-white z-10 hidden sm:flex">
        <div className="flex items-center gap-3">
          <div className="text-blue-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <h2 className="text-gray-900 text-xl font-bold tracking-tight">LearnPath</h2>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#" className="text-gray-600 text-sm font-medium hover:text-blue-600 transition-colors">Features</Link>
            <Link href="#" className="text-gray-600 text-sm font-medium hover:text-blue-600 transition-colors">Pricing</Link>
          </nav>
          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
          <Link href="/login" className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-xl h-10 px-5 border border-gray-200 text-gray-900 text-sm font-bold hover:bg-gray-100 transition-colors">
            Log in
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side: Illustration Section */}
        <div className="hidden lg:flex flex-1 relative bg-blue-50 items-center justify-center p-12 overflow-hidden">
          <div className="relative z-10 max-w-xl text-center">
            <div className="mb-10 inline-flex items-center justify-center p-4 bg-white rounded-3xl shadow-xl shadow-blue-600/10">
              <svg className="w-16 h-16 text-blue-600 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h1 className="text-4xl xl:text-5xl font-black leading-tight tracking-tight text-gray-900 mb-6">
              Unlock your potential with <span className="text-blue-600">AI-driven</span> growth.
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              The world's first AI-powered personal learning operating system designed to adapt to how you learn best.
            </p>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white">
                <svg className="w-6 h-6 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                <p className="text-sm font-bold text-gray-900">Smart Progress Tracking</p>
              </div>
              <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white">
                <svg className="w-6 h-6 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
                <p className="text-sm font-bold text-gray-900">Knowledge Graphs</p>
              </div>
            </div>
          </div>
          
          {/* Abstract Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -ml-48 -mb-48"></div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gray-50">
          <div className="w-full max-w-md">
            <div className="bg-white p-8 lg:p-10 rounded-xl shadow-lg border border-gray-100">
              <div className="mb-10 text-center lg:text-left">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Create an account</h1>
                <p className="text-gray-500 text-sm">Start your personalized learning journey today.</p>
              </div>

              <form className="space-y-5" onSubmit={handleEmailSignup}>
                <div className="space-y-4">
                  {/* Full Name Field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-700 text-sm font-medium" htmlFor="name">Full name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      </div>
                      <input 
                        id="name" 
                        name="name" 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="********" 
                        required 
                        className="block w-full pl-11 pr-4 h-12 rounded-lg border border-gray-200 bg-gray-50/50 text-gray-900 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none" 
                      />
                    </div>
                    {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                  </div>

                  {/* Email Field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-700 text-sm font-medium" htmlFor="email">Email address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                      </div>
                      <input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="********" 
                        required 
                        className="block w-full pl-11 pr-4 h-12 rounded-lg border border-gray-200 bg-gray-50/50 text-gray-900 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none" 
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                  </div>

                  {/* Password Field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-700 text-sm font-medium" htmlFor="password">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                      </div>
                      <input 
                        id="password" 
                        name="password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********" 
                        required 
                        minLength={8}
                        className="block w-full pl-11 pr-12 h-12 rounded-lg border border-gray-200 bg-gray-50/50 text-gray-900 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none" 
                      />
                    </div>
                    {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                    <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long.</p>
                  </div>
                </div>

                {errors.general && <p className="text-red-500 text-sm">{errors.general}</p>}

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </button>
                </div>
              </form>

              <div className="relative mt-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500">Or sign up with</span>
                </div>
              </div>

              <div className="mt-8">
                <button type="button" onClick={handleGoogleSignup} className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path></svg>
                  Google
                </button>
              </div>

              <p className="mt-8 text-center text-sm text-gray-500 lg:hidden">
                Already have an account? <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">Log in</Link>
              </p>
            </div>
            
            <p className="mt-8 text-center text-xs text-gray-400">
              By registering, you agree to our <Link href="#" className="hover:text-gray-600 transition-colors underline">Terms of Service</Link> and <Link href="#" className="hover:text-gray-600 transition-colors underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
