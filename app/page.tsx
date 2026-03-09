import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gray-950 text-white">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Your Personal Learning OS
          </h1>
          <p className="mt-6 text-xl text-gray-300">
            Stop searching. Start learning. AI-powered paths from zero to job-ready.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Get Started Free
            </Link>
            <Link
              href="/explore"
              className="rounded-lg border border-gray-600 px-8 py-3 text-base font-semibold text-gray-200 hover:border-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Browse Domains
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Everything you need to level up
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                AI Skill Assessment
              </h3>
              <p className="text-gray-600">
                Get assessed on what you know. Skip what you don&apos;t need.
              </p>
            </div>
            <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                Personalized Roadmap
              </h3>
              <p className="text-gray-600">
                A learning path built for your level, goal, and schedule.
              </p>
            </div>
            <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                Track Real Progress
              </h3>
              <p className="text-gray-600">
                Checkpoints verify understanding. Not just watch time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 text-center text-sm text-gray-500">
        LearnPath © 2026
      </footer>
    </div>
  )
}

