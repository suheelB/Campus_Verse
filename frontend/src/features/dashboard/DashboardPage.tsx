import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight, CheckCircle2, Compass, Loader2, Megaphone, Plus, ShieldAlert, Users } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { clubsApi } from '@/services/clubsApi'
import { announcementsApi } from '@/services/announcementsApi'

export function DashboardPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const memberships = useQuery({ queryKey: ['my-clubs'], queryFn: clubsApi.myMemberships })
  const requests = useQuery({ queryKey: ['my-club-requests'], queryFn: clubsApi.mine })
  const announcements = useQuery({ queryKey: ['announcements-feed', 0], queryFn: () => announcementsApi.feed({ page: 0, size: 5 }) })

  const ackMutation = useMutation({
    mutationFn: announcementsApi.acknowledge,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['announcements-feed'] })
    },
  })

  const active = memberships.data?.filter((membership) => membership.status === 'ACTIVE') || []
  const pendingMemberships = memberships.data?.filter((membership) => membership.status === 'PENDING') || []
  const pendingClubs = requests.data?.filter((club) => club.status === 'PENDING_APPROVAL') || []
  const announcementItems = announcements.data?.content || []
  const pendingAcks = announcementItems.filter((a) => a.requiresAcknowledgement && !a.acknowledged)

  return <div className="mx-auto max-w-7xl space-y-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-semibold uppercase tracking-wider text-primary-700">CampusVerse</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Welcome back, {user?.displayName || 'Student'}</h1><p className="mt-2 text-gray-600">Your clubs, notices, and applications, all in one place.</p></div>
      <div className="flex gap-2">
        <Link to="/announcements" className="btn-outline gap-2"><Megaphone className="h-4 w-4" />Notices</Link>
        <Link to="/clubs" className="btn-primary gap-2"><Plus className="h-4 w-4" />Find a club</Link>
      </div>
    </header>

    {(memberships.isError || requests.isError) && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Couldn’t load your club dashboard. Refresh to try again.</div>}
    {(memberships.isLoading || requests.isLoading) && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Loading your activity…</div>}

    <section className="grid gap-4 sm:grid-cols-4" aria-label="Club summary">
      <Summary label="Joined clubs" count={active.length} detail="Active memberships" />
      <Summary label="Applications" count={pendingMemberships.length} detail="Waiting for a decision" />
      <Summary label="Club requests" count={pendingClubs.length} detail="Awaiting college approval" />
      <Summary label="Action notices" count={pendingAcks.length} detail="Require your acknowledgement" />
    </section>

    {/* Announcements Section */}
    {announcementItems.length > 0 && (
      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary-700" />
            <h2 className="text-lg font-semibold">Latest announcements</h2>
          </div>
          <Link to="/announcements" className="text-sm font-semibold text-primary-700 hover:underline">
            View all ({announcements.data?.totalElements || 0}) →
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {announcementItems.slice(0, 3).map((a) => (
            <div key={a.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {a.priority === 'URGENT' && (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800 flex items-center gap-0.5">
                      <ShieldAlert className="h-3 w-3" /> URGENT
                    </span>
                  )}
                  {a.priority === 'IMPORTANT' && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 flex items-center gap-0.5">
                      <AlertTriangle className="h-3 w-3" /> IMPORTANT
                    </span>
                  )}
                  <span className="font-semibold text-gray-900 truncate">{a.title}</span>
                  <span className="text-xs text-gray-400">· {a.clubName || 'College'}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600 line-clamp-1">{a.body}</p>
              </div>
              <div>
                {a.requiresAcknowledgement && !a.acknowledged ? (
                  <button
                    className="btn-primary !py-1 !px-2.5 text-xs"
                    disabled={ackMutation.isPending}
                    onClick={() => ackMutation.mutate(a.id)}
                  >
                    Acknowledge
                  </button>
                ) : a.requiresAcknowledgement ? (
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Acknowledged
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    )}

    <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="card p-6">
        <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Your memberships</h2><p className="mt-1 text-sm text-gray-500">The communities you’re part of</p></div><Link to="/my-clubs" className="text-sm font-semibold text-primary-700 hover:underline">View all</Link></div>
        {active.length === 0 && !memberships.isLoading ? <div className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center"><Users className="mx-auto h-8 w-8 text-gray-400" /><p className="mt-3 font-medium">No memberships yet</p><p className="mt-1 text-sm text-gray-500">Discover a club that matches your interests.</p><Link to="/clubs" className="btn-outline mt-4">Explore clubs</Link></div> : <ul className="divide-y divide-gray-100">{active.slice(0, 5).map((item) => <li key={item.id} className="flex items-center justify-between gap-4 py-4"><div><Link className="font-medium hover:text-primary-700" to={`/clubs/${item.clubId}`}>{item.clubName}</Link><p className="mt-1 text-sm text-gray-500">{item.roleName}</p></div><ArrowRight className="h-4 w-4 text-gray-400" /></li>)}</ul>}
      </div>
      <div className="space-y-6">
        <div className="card p-6"><h2 className="text-lg font-semibold">Quick links</h2><div className="mt-4 grid gap-3"><Link to="/announcements" className="btn-outline justify-start gap-3"><Megaphone className="h-4 w-4" />Campus announcements</Link><Link to="/clubs" className="btn-outline justify-start gap-3"><Compass className="h-4 w-4" />Discover clubs</Link><Link to="/my-clubs" className="btn-outline justify-start gap-3"><Users className="h-4 w-4" />Applications & memberships</Link><Link to="/clubs/manage" className="btn-outline justify-start gap-3"><ArrowRight className="h-4 w-4" />Club management</Link></div></div>
        <div className="rounded-xl bg-primary-900 p-6 text-white"><p className="text-sm font-semibold text-primary-200">Make it yours</p><h2 className="mt-2 text-xl font-semibold">Have an idea for a club?</h2><p className="mt-2 text-sm leading-6 text-primary-100">Send a request to your college. Once approved, your club is listed for students.</p><Link to="/clubs" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white hover:underline">Request a club <ArrowRight className="h-4 w-4" /></Link></div>
      </div>
    </section>
  </div>
}

function Summary({ label, count, detail }: { label: string; count: number; detail: string }) {
  return <article className="card p-5"><p className="text-sm font-medium text-gray-600">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-gray-950">{count}</p><p className="mt-1 text-sm text-gray-500">{detail}</p></article>
}
