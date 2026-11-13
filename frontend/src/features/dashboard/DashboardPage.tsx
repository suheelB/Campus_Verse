import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Compass, Loader2, Plus, Users } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { clubsApi } from '@/services/clubsApi'

export function DashboardPage() {
  const { user } = useAuth()
  const memberships = useQuery({ queryKey: ['my-clubs'], queryFn: clubsApi.myMemberships })
  const requests = useQuery({ queryKey: ['my-club-requests'], queryFn: clubsApi.mine })
  const active = memberships.data?.filter((membership) => membership.status === 'ACTIVE') || []
  const pendingMemberships = memberships.data?.filter((membership) => membership.status === 'PENDING') || []
  const pendingClubs = requests.data?.filter((club) => club.status === 'PENDING_APPROVAL') || []

  return <div className="mx-auto max-w-7xl space-y-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-semibold uppercase tracking-wider text-primary-700">CampusVerse</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Welcome back, {user?.displayName || 'Student'}</h1><p className="mt-2 text-gray-600">Your clubs and applications, all in one place.</p></div>
      <Link to="/clubs" className="btn-primary gap-2"><Plus className="h-4 w-4" />Find a club</Link>
    </header>

    {(memberships.isError || requests.isError) && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Couldn’t load your club dashboard. Refresh to try again.</div>}
    {(memberships.isLoading || requests.isLoading) && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Loading your activity…</div>}

    <section className="grid gap-4 sm:grid-cols-3" aria-label="Club summary">
      <Summary label="Joined clubs" count={active.length} detail="Active memberships" />
      <Summary label="Applications" count={pendingMemberships.length} detail="Waiting for a decision" />
      <Summary label="Club requests" count={pendingClubs.length} detail="Awaiting college approval" />
    </section>

    <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="card p-6">
        <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Your memberships</h2><p className="mt-1 text-sm text-gray-500">The communities you’re part of</p></div><Link to="/my-clubs" className="text-sm font-semibold text-primary-700 hover:underline">View all</Link></div>
        {active.length === 0 && !memberships.isLoading ? <div className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center"><Users className="mx-auto h-8 w-8 text-gray-400" /><p className="mt-3 font-medium">No memberships yet</p><p className="mt-1 text-sm text-gray-500">Discover a club that matches your interests.</p><Link to="/clubs" className="btn-outline mt-4">Explore clubs</Link></div> : <ul className="divide-y divide-gray-100">{active.slice(0, 5).map((item) => <li key={item.id} className="flex items-center justify-between gap-4 py-4"><div><Link className="font-medium hover:text-primary-700" to={`/clubs/${item.clubId}`}>{item.clubName}</Link><p className="mt-1 text-sm text-gray-500">{item.roleName}</p></div><ArrowRight className="h-4 w-4 text-gray-400" /></li>)}</ul>}
      </div>
      <div className="space-y-6">
        <div className="card p-6"><h2 className="text-lg font-semibold">Quick links</h2><div className="mt-4 grid gap-3"><Link to="/clubs" className="btn-outline justify-start gap-3"><Compass className="h-4 w-4" />Discover clubs</Link><Link to="/my-clubs" className="btn-outline justify-start gap-3"><Users className="h-4 w-4" />Applications & memberships</Link><Link to="/clubs/manage" className="btn-outline justify-start gap-3"><ArrowRight className="h-4 w-4" />Club management</Link></div></div>
        <div className="rounded-xl bg-primary-900 p-6 text-white"><p className="text-sm font-semibold text-primary-200">Make it yours</p><h2 className="mt-2 text-xl font-semibold">Have an idea for a club?</h2><p className="mt-2 text-sm leading-6 text-primary-100">Send a request to your college. Once approved, your club is listed for students.</p><Link to="/clubs" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white hover:underline">Request a club <ArrowRight className="h-4 w-4" /></Link></div>
      </div>
    </section>
  </div>
}

function Summary({ label, count, detail }: { label: string; count: number; detail: string }) {
  return <article className="card p-5"><p className="text-sm font-medium text-gray-600">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-gray-950">{count}</p><p className="mt-1 text-sm text-gray-500">{detail}</p></article>
}
