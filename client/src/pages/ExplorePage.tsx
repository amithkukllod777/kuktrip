import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Compass, MapPin, Plus, ShieldCheck, Users } from 'lucide-react'
import { apiClient } from '../api/client'

type Activity = {
  id: number
  hostUserId: number
  title: string
  category: string
  description?: string | null
  destination?: string | null
  area?: string | null
  startAt: string
  endAt?: string | null
  timezone?: string | null
  capacity?: number | null
  joinMode: 'open' | 'approval' | 'invite_only'
  lat?: number | null
  lng?: number | null
  participantCount?: number
  myStatus?: string | null
}

type CreateActivity = {
  title: string
  category: string
  destination: string
  area: string
  startAt: string
  capacity: string
  joinMode: 'open' | 'approval'
}

const emptyCreate: CreateActivity = {
  title: '', category: 'meetup', destination: '', area: '', startAt: '', capacity: '10', joinMode: 'approval',
}

export default function ExplorePage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [create, setCreate] = useState<CreateActivity>(emptyCreate)
  const [saving, setSaving] = useState(false)
  const [discoveryEnabled, setDiscoveryEnabled] = useState(false)

  const query = useMemo(() => destination.trim(), [destination])

  async function load() {
    setLoading(true); setError(null)
    try {
      const response = await apiClient.get<Activity[]>('/explore/activities', { params: query ? { destination: query } : undefined })
      setActivities(response.data)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Explore is not available yet for this account.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  async function join(id: number) {
    setJoining(id); setError(null)
    try {
      const { data } = await apiClient.post<{ status: string }>(`/explore/activities/${id}/join`)
      setActivities(list => list.map(a => a.id === id ? { ...a, myStatus: data.status } : a))
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Could not join this activity.')
    } finally { setJoining(null) }
  }

  async function submitCreate(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(null)
    try {
      await apiClient.post('/explore/activities', {
        title: create.title.trim(), category: create.category.trim(),
        destination: create.destination.trim() || null, area: create.area.trim() || null,
        startAt: new Date(create.startAt).toISOString(), capacity: Number(create.capacity) || null,
        joinMode: create.joinMode, visibility: 'public',
      })
      setCreate(emptyCreate); setCreateOpen(false); await load()
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Could not create this activity.')
    } finally { setSaving(false) }
  }

  async function toggleDiscovery() {
    const next = !discoveryEnabled
    try {
      await apiClient.put('/explore/discovery', { enabled: next, showUpcomingDestinations: next, interests: [] })
      setDiscoveryEnabled(next)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Could not change traveler discovery.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-28">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-600"><Compass size={18}/> KukTrip Explore</div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Find things worth doing where you are going.</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Discover public activities, join travelers safely, or host an activity around your trip.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleDiscovery} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={17}/>{discoveryEnabled ? 'Traveler discovery on' : 'Traveler discovery off'}</span>
            </button>
            <button onClick={() => setCreateOpen(v => !v)} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm">
              <span className="inline-flex items-center gap-2"><Plus size={17}/>Host activity</span>
            </button>
          </div>
        </header>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1"><MapPin className="absolute left-3 top-3.5 text-slate-400" size={18}/><input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Destination — Bali, Dubai, Goa…" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-slate-400"/></div>
            <button onClick={() => void load()} className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white">Search</button>
          </div>
        </section>

        {createOpen && (
          <form onSubmit={submitCreate} className="mt-5 grid gap-3 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm md:grid-cols-2">
            <input required value={create.title} onChange={e => setCreate({...create,title:e.target.value})} placeholder="Activity title" className="rounded-xl border p-3"/>
            <input required value={create.category} onChange={e => setCreate({...create,category:e.target.value})} placeholder="Category" className="rounded-xl border p-3"/>
            <input value={create.destination} onChange={e => setCreate({...create,destination:e.target.value})} placeholder="Destination" className="rounded-xl border p-3"/>
            <input value={create.area} onChange={e => setCreate({...create,area:e.target.value})} placeholder="Area / neighbourhood" className="rounded-xl border p-3"/>
            <input required type="datetime-local" value={create.startAt} onChange={e => setCreate({...create,startAt:e.target.value})} className="rounded-xl border p-3"/>
            <div className="flex gap-3"><input type="number" min="2" max="500" value={create.capacity} onChange={e => setCreate({...create,capacity:e.target.value})} className="min-w-0 flex-1 rounded-xl border p-3"/><select value={create.joinMode} onChange={e => setCreate({...create,joinMode:e.target.value as CreateActivity['joinMode']})} className="rounded-xl border p-3"><option value="approval">Approval</option><option value="open">Open join</option></select></div>
            <div className="md:col-span-2 flex justify-end gap-2"><button type="button" onClick={() => setCreateOpen(false)} className="rounded-xl px-4 py-2 font-semibold text-slate-600">Cancel</button><button disabled={saving} className="rounded-xl bg-slate-950 px-5 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Creating…' : 'Create activity'}</button></div>
          </form>
        )}

        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? <div className="text-slate-500">Loading activities…</div> : activities.length === 0 ? <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No public activities found yet.</div> : activities.map(activity => (
            <article key={activity.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-wide text-indigo-600">{activity.category}</div><h2 className="mt-1 text-xl font-bold text-slate-950">{activity.title}</h2></div><div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{activity.joinMode === 'open' ? 'Open' : 'Approval'}</div></div>
              {activity.description && <p className="mt-3 line-clamp-3 text-sm text-slate-600">{activity.description}</p>}
              <div className="mt-4 space-y-2 text-sm text-slate-600"><div className="flex items-center gap-2"><MapPin size={16}/>{[activity.area,activity.destination].filter(Boolean).join(', ') || 'Destination not specified'}</div><div className="flex items-center gap-2"><CalendarDays size={16}/>{new Date(activity.startAt).toLocaleString()}</div><div className="flex items-center gap-2"><Users size={16}/>{activity.participantCount || 0}{activity.capacity ? ` / ${activity.capacity}` : ''} joined</div></div>
              <button disabled={joining===activity.id || activity.myStatus==='approved' || activity.myStatus==='pending'} onClick={() => void join(activity.id)} className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-300">{activity.myStatus === 'approved' ? 'Joined' : activity.myStatus === 'pending' ? 'Request pending' : joining===activity.id ? 'Joining…' : activity.joinMode==='open' ? 'Join activity' : 'Request to join'}</button>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
