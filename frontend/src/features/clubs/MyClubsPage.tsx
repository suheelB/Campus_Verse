import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, Loader2, Users } from 'lucide-react'
import { clubsApi } from '@/services/clubsApi'

export function MyClubsPage() {
  const client = useQueryClient()
  const memberships = useQuery({ queryKey: ['my-clubs'], queryFn: clubsApi.myMemberships })
  const leave = useMutation({
    mutationFn: clubsApi.leave,
    onSuccess: () => client.invalidateQueries({ queryKey: ['my-clubs'] }),
  })
  const myRequests = useQuery({ queryKey: ['my-club-requests'], queryFn: clubsApi.mine })

  if (memberships.isLoading || myRequests.isLoading) return <div className="flex min-h-60 items-center justify-center text-gray-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading your clubs…</div>
  if (memberships.isError || myRequests.isError) return <div className="card p-8 text-center"><p role="alert" className="text-red-700">Couldn’t load your club information.</p><button className="btn-outline mt-4" onClick={() => { void memberships.refetch(); void myRequests.refetch() }}>Try again</button></div>

  const items = memberships.data || []
  const active = items.filter((item) => item.status === 'ACTIVE')
  const applications = items.filter((item) => item.status !== 'ACTIVE')

  return <div className="mx-auto max-w-5xl space-y-9">
    <header>
      <p className="text-sm font-semibold uppercase tracking-wider text-primary-700">Your campus life</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">My clubs</h1>
      <p className="mt-2 text-gray-600">Your memberships, applications, and club requests.</p>
    </header>

    <section>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">Memberships <span className="text-gray-400">({active.length})</span></h2><Link className="text-sm font-semibold text-primary-700 hover:underline" to="/clubs">Find clubs</Link></div>
      {active.length === 0 ? <Empty message="You haven’t joined any clubs yet." /> : <div className="grid gap-4 sm:grid-cols-2">
        {active.map((item) => <article className="card flex items-center justify-between gap-4 p-5" key={item.id}>
          <div className="min-w-0"><p className="font-semibold">{item.clubName}</p><p className="mt-1 text-sm text-gray-600">{item.roleName} · Joined {new Date(item.appliedAt).toLocaleDateString()}</p><Link className="mt-2 inline-flex items-center gap-1 text-sm text-primary-700 hover:underline" to={`/clubs/${item.clubId}`}>Club details <ArrowUpRight className="h-3.5 w-3.5" /></Link></div>
          <button className="btn-outline shrink-0" disabled={leave.isPending} onClick={() => { if (window.confirm(`Leave ${item.clubName}?`)) leave.mutate(item.clubId) }}>Leave</button>
        </article>)}
      </div>}
    </section>

    <section>
      <h2 className="mb-4 text-xl font-semibold">Applications <span className="text-gray-400">({applications.length})</span></h2>
      {applications.length === 0 ? <Empty message="No pending applications." /> : <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {applications.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4 last:border-0 sm:px-5">
          <div><Link className="font-medium hover:text-primary-700" to={`/clubs/${item.clubId}`}>{item.clubName}</Link><p className="mt-1 text-sm text-gray-500">Applied {new Date(item.appliedAt).toLocaleDateString()}{item.rejectionReason ? ` · ${item.rejectionReason}` : ''}</p></div>
          <span className={statusClass(item.status)}>{formatStatus(item.status)}</span>
        </div>)}
      </div>}
    </section>

    <section>
      <h2 className="mb-4 text-xl font-semibold">Club requests <span className="text-gray-400">({myRequests.data?.length || 0})</span></h2>
      {!myRequests.data?.length ? <Empty message="You haven’t requested a club yet." /> : <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {myRequests.data.map((club) => <div key={club.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4 last:border-0 sm:px-5">
          <div><p className="font-medium">{club.name}</p><p className="mt-1 text-sm text-gray-500">Requested {club.createdAt ? new Date(club.createdAt).toLocaleDateString() : 'recently'}{club.rejectionReason ? ` · ${club.rejectionReason}` : ''}</p></div>
          <span className={statusClass(club.status)}>{formatStatus(club.status)}</span>
        </div>)}
      </div>}
    </section>
  </div>
}

function Empty({ message }: { message: string }) {
  return <div className="card flex items-center gap-3 p-5 text-sm text-gray-600"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"><Users className="h-5 w-5" /></span>{message}</div>
}
function statusClass(status: string) {
  if (status === 'ACTIVE') return 'badge-success'
  if (status === 'PENDING' || status === 'PENDING_APPROVAL') return 'badge-warning'
  return 'badge-destructive'
}
function formatStatus(status: string) {
  return status.toLowerCase().replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase())
}
