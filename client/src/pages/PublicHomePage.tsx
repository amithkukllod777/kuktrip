import React from 'react'

const features = [
  ['AI Trip Planner', 'Turn a destination, budget and preferences into a practical day-by-day plan.'],
  ['Smart Itinerary', 'Keep places, timings, transport, bookings and notes in one timeline.'],
  ['Maps & Routes', 'See every stop on the map, explore nearby places and optimize your route.'],
  ['Group Planning', 'Plan together with shared trips, polls, notes and expense splitting.'],
  ['Bookings & Documents', 'Keep flights, stays, confirmations, files and travel details together.'],
  ['Offline Travel', 'Prepare trip data and maps before you go so key plans remain available offline.'],
]

const steps = [
  ['01', 'Tell KukTrip your plan', 'Destination, dates, travelers, budget and what you enjoy.'],
  ['02', 'Build the trip', 'Create the itinerary, map the route, add bookings and organize the details.'],
  ['03', 'Travel with one workspace', 'Use the live itinerary, maps, costs, files and collaboration while traveling.'],
]

export default function PublicHomePage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#101828] selection:bg-blue-100">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <a href="/" className="flex items-center gap-3" aria-label="Kuk Trip home">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-sm">K</div>
            <div className="text-lg font-semibold tracking-tight">Kuk Trip</div>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-950">Features</a>
            <a href="#how-it-works" className="hover:text-slate-950">How it works</a>
            <a href="#mobile" className="hover:text-slate-950">Mobile</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href="/login?redirect=%2Fdashboard" className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-flex">Sign in</a>
            <a href="/login?redirect=%2Fdashboard" className="inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">Plan a trip</a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-0 h-[520px] bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,235,0.16),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(14,165,233,0.12),transparent_38%)]" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[1.05fr_.95fr] lg:py-28">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              AI-powered travel planning by Kuklabs
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Plan the trip. Organize every detail. <span className="text-blue-600">Enjoy the journey.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Kuk Trip brings itineraries, maps, reservations, budgets, packing, documents and group planning into one travel workspace — with AI assistance built for the whole journey.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/login?redirect=%2Fdashboard" className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700">
                Start planning free
              </a>
              <a href="#features" className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                Explore features
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              <span>✓ One Kuklabs Account</span>
              <span>✓ Web + Android + iOS</span>
              <span>✓ Offline-ready planning</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-6 rounded-[40px] bg-blue-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[30px] border border-white/80 bg-white p-4 shadow-2xl shadow-slate-900/10 sm:p-5">
              <div className="rounded-[22px] bg-slate-950 p-5 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Upcoming trip</p>
                    <h2 className="mt-2 text-2xl font-semibold">Bali Escape</h2>
                    <p className="mt-1 text-sm text-slate-300">7 days · 2 travelers · IDR / INR</p>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2 text-right">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Day 3</p>
                    <p className="text-sm font-semibold">Ubud</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-white/10 px-2 py-3"><strong className="block text-base">12</strong><span className="text-slate-400">places</span></div>
                  <div className="rounded-xl bg-white/10 px-2 py-3"><strong className="block text-base">4</strong><span className="text-slate-400">bookings</span></div>
                  <div className="rounded-xl bg-white/10 px-2 py-3"><strong className="block text-base">₹1.4L</strong><span className="text-slate-400">budget</span></div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1.15fr_.85fr]">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between"><p className="text-sm font-semibold">Today’s plan</p><span className="text-xs text-blue-600">View itinerary</span></div>
                  <div className="mt-4 space-y-4">
                    {[['08:30','Campuhan Ridge Walk'],['11:00','Ubud Palace'],['13:00','Lunch in central Ubud'],['16:30','Tegalalang Rice Terrace']].map(([time,title]) => (
                      <div className="flex gap-3" key={time}>
                        <div className="w-11 text-xs font-semibold text-slate-400">{time}</div>
                        <div className="relative flex-1 border-l border-slate-200 pl-4 text-sm font-medium before:absolute before:-left-1.5 before:top-1 before:h-3 before:w-3 before:rounded-full before:border-2 before:border-blue-600 before:bg-white">{title}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">KukTrip AI</p>
                  <p className="mt-3 text-sm font-semibold leading-6">You have 2 hours free before sunset.</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">I found a nearby cooking workshop that fits your route and budget.</p>
                  <button className="mt-4 w-full rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-blue-700 shadow-sm">Review suggestion</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-blue-600">Everything for the trip</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From first idea to the final memory.</h2>
            <p className="mt-4 text-slate-600">One organized workspace instead of scattered notes, screenshots, spreadsheets and booking emails.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(([title, copy]) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5">
                <div className="mb-4 h-10 w-10 rounded-xl bg-blue-50 ring-1 ring-blue-100" />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold text-blue-600">Simple by design</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Go from “where should we go?” to a trip you can actually follow.</h2>
            </div>
            <div className="grid gap-4">
              {steps.map(([num,title,copy]) => (
                <div key={num} className="grid grid-cols-[54px_1fr] gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-950 text-sm font-semibold text-white">{num}</div>
                  <div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="mobile" className="bg-slate-950 py-20 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 md:px-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-blue-400">Built for every screen</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Web today. Native Android and iOS in the same product roadmap.</h2>
            <p className="mt-4 max-w-xl leading-7 text-slate-300">The mobile apps are being built around the same Kuklabs Account, trip data and service contracts so your plans stay consistent across web, Android and iPhone.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {['Live itinerary','Offline access','Maps & routes','Bookings','Costs & splits','Group planning','Travel files','AI assistance'].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200">✓ {item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-5 text-center md:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Your next trip belongs in one place.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">Start with a simple trip and keep adding the details as your journey takes shape.</p>
          <a href="/login?redirect=%2Fdashboard" className="mt-8 inline-flex rounded-2xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 hover:bg-blue-700">Start planning with Kuk Trip</a>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:px-8">
          <div><span className="font-semibold text-slate-800">Kuk Trip</span> · Powered by Kuklabs</div>
          <div className="flex gap-5"><a href="https://kuklabs.com/privacy" className="hover:text-slate-800">Privacy</a><a href="https://kuklabs.com/terms" className="hover:text-slate-800">Terms</a><a href="/login?redirect=%2Fdashboard" className="hover:text-slate-800">Sign in</a></div>
        </div>
      </footer>
    </main>
  )
}
