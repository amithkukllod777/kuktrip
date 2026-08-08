import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, MapPin, Wallet, Users, CalendarDays, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Navbar from '../components/Layout/Navbar'

type Pace = 'relaxed' | 'balanced' | 'packed'

type Proposal = {
  title: string
  destination: string
  summary: string
  currency: string
  estimatedTotal: number | null
  days: Array<{
    dayNumber: number
    date: string | null
    title: string
    estimatedCost: number | null
    activities: Array<{
      name: string
      category: string
      startTime: string | null
      durationMinutes: number | null
      area: string | null
      notes: string | null
      estimatedCost: number | null
    }>
  }>
  assumptions: string[]
  warnings: string[]
}

type AiResponse = {
  provider: string
  proposal: Proposal
  mutationApplied: boolean
  requiresReview: boolean
}

export default function AiTripPlannerPage(): React.ReactElement {
  const navigate = useNavigate()
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dayCount, setDayCount] = useState('7')
  const [adults, setAdults] = useState('2')
  const [children, setChildren] = useState('0')
  const [budget, setBudget] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [interests, setInterests] = useState('food, culture, nature')
  const [pace, setPace] = useState<Pace>('balanced')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AiResponse | null>(null)

  const canSubmit = destination.trim().length > 1 && !loading
  const estimate = useMemo(() => {
    if (!result?.proposal.estimatedTotal) return null
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: result.proposal.currency || currency, maximumFractionDigits: 0 }).format(result.proposal.estimatedTotal)
  }, [result, currency])

  async function generate() {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const response = await fetch('/api/ai/trip-plan', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destination.trim(),
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          dayCount: Number(dayCount) || undefined,
          travelers: { adults: Number(adults) || 1, children: Number(children) || 0 },
          budget: budget ? Number(budget) : undefined,
          currency: currency.trim() || 'INR',
          interests: interests.split(',').map(v => v.trim()).filter(Boolean),
          pace,
          notes: notes.trim() || undefined,
        }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body?.error || body?.message || 'KukTrip AI could not create a plan.')
      setResult(body as AiResponse)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'KukTrip AI could not create a plan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-7xl">
          <button onClick={() => navigate('/dashboard')} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"><ArrowLeft size={16} /> Back to trips</button>
          <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-6 flex items-start gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><Sparkles size={22} /></div><div><h1 className="text-xl font-bold text-slate-950">Plan with KukTrip AI</h1><p className="mt-1 text-sm text-slate-500">Tell us the constraints. AI prepares a proposal; nothing is saved until you review it.</p></div></div>
              <div className="space-y-4">
                <Field label="Destination" icon={<MapPin size={16} />}><input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Bali, Indonesia" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-400" /></Field>
                <div className="grid grid-cols-2 gap-3"><Field label="Start"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" /></Field><Field label="End"><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" /></Field></div>
                <div className="grid grid-cols-3 gap-3"><Field label="Days" icon={<CalendarDays size={15} />}><input inputMode="numeric" value={dayCount} onChange={e => setDayCount(e.target.value.replace(/\D/g, ''))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" /></Field><Field label="Adults" icon={<Users size={15} />}><input inputMode="numeric" value={adults} onChange={e => setAdults(e.target.value.replace(/\D/g, ''))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" /></Field><Field label="Children"><input inputMode="numeric" value={children} onChange={e => setChildren(e.target.value.replace(/\D/g, ''))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" /></Field></div>
                <div className="grid grid-cols-[1fr_110px] gap-3"><Field label="Budget" icon={<Wallet size={15} />}><input inputMode="decimal" value={budget} onChange={e => setBudget(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="150000" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" /></Field><Field label="Currency"><input value={currency} onChange={e => setCurrency(e.target.value.toUpperCase().slice(0, 3))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" /></Field></div>
                <Field label="Interests"><input value={interests} onChange={e => setInterests(e.target.value)} placeholder="food, beaches, temples" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" /></Field>
                <Field label="Pace"><div className="grid grid-cols-3 gap-2">{(['relaxed','balanced','packed'] as Pace[]).map(v => <button key={v} onClick={() => setPace(v)} className={`rounded-xl border px-2 py-2 text-sm capitalize ${pace === v ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200'}`}>{v}</button>)}</div></Field>
                <Field label="Anything else?"><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Kids-friendly, vegetarian food, avoid very early mornings…" className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5" /></Field>
              </div>
              {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <button disabled={!canSubmit} onClick={generate} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><Sparkles size={18} /> {loading ? 'Building your trip…' : 'Generate itinerary'}</button>
            </section>
            <section className="min-h-[520px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
              {!result && !loading && <div className="grid h-full min-h-[480px] place-items-center text-center"><div className="max-w-md"><Sparkles className="mx-auto mb-4 text-indigo-500" size={42} /><h2 className="text-2xl font-bold text-slate-900">Your itinerary will appear here</h2><p className="mt-2 text-slate-500">KukTrip AI returns a reviewable plan with day-by-day activities, estimates, assumptions and warnings.</p></div></div>}
              {loading && <div className="grid min-h-[480px] place-items-center"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" /><p className="mt-4 font-medium text-slate-600">Planning routes, pace and daily flow…</p></div></div>}
              {result && <ProposalView result={result} estimate={estimate} />}
            </section>
          </div>
        </div>
      </main>
    </>
  )
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{icon}{label}</span>{children}</label> }

function ProposalView({ result, estimate }: { result: AiResponse; estimate: string | null }) {
  const p = result.proposal
  return <div>
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5"><div><div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={13}/> Review-ready proposal</div><h2 className="text-2xl font-bold text-slate-950">{p.title}</h2><p className="mt-1 max-w-2xl text-slate-600">{p.summary}</p></div>{estimate && <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right"><div className="text-xs text-slate-500">Estimated total</div><div className="text-lg font-bold text-slate-900">{estimate}</div></div>}</div>
    <div className="mt-5 space-y-4">{p.days.map(day => <article key={day.dayNumber} className="rounded-2xl border border-slate-200 p-4"><div className="mb-3 flex items-start justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-wider text-indigo-600">Day {day.dayNumber}{day.date ? ` • ${day.date}` : ''}</div><h3 className="mt-1 text-lg font-bold text-slate-900">{day.title}</h3></div>{day.estimatedCost != null && <span className="text-sm font-semibold text-slate-600">≈ {day.estimatedCost} {p.currency}</span>}</div><div className="space-y-2">{day.activities.map((a, i) => <div key={`${day.dayNumber}-${i}`} className="grid grid-cols-[54px_1fr] gap-3 rounded-xl bg-slate-50 p-3"><div className="text-sm font-semibold text-slate-500">{a.startTime || '—'}</div><div><div className="font-semibold text-slate-900">{a.name}</div><div className="mt-0.5 text-xs text-slate-500">{[a.category, a.area, a.durationMinutes ? `${a.durationMinutes} min` : null].filter(Boolean).join(' • ')}</div>{a.notes && <div className="mt-1 text-sm text-slate-600">{a.notes}</div>}</div></div>)}</div></article>)}</div>
    {(p.assumptions.length > 0 || p.warnings.length > 0) && <div className="mt-5 grid gap-3 md:grid-cols-2">{p.assumptions.length > 0 && <div className="rounded-2xl bg-blue-50 p-4"><div className="font-semibold text-blue-900">Assumptions</div><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-800">{p.assumptions.map((v,i)=><li key={i}>{v}</li>)}</ul></div>}{p.warnings.length > 0 && <div className="rounded-2xl bg-amber-50 p-4"><div className="flex items-center gap-2 font-semibold text-amber-900"><AlertTriangle size={16}/> Check before booking</div><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">{p.warnings.map((v,i)=><li key={i}>{v}</li>)}</ul></div>}</div>}
    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">This proposal has <strong>not</strong> changed your trip yet. The next apply flow will let you review and create the trip safely through normal KukTrip APIs.</div>
  </div>
}
