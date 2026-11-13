import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Users } from 'lucide-react'
import { clubsApi } from '@/services/clubsApi'
import type { Membership } from '@/types/club'

export function ClubManagementPage() {
  const client = useQueryClient()
  const mine = useQuery({ queryKey: ['my-clubs'], queryFn: clubsApi.myMemberships })
  const adminRequests = useQuery({ queryKey: ['club-approval-requests'], queryFn: clubsApi.pendingApprovals, retry: false })
  const decideClub = useMutation({
    mutationFn: ({ id, approve, reason }: { id: string; approve: boolean; reason?: string }) => approve ? clubsApi.approve(id) : clubsApi.reject(id, reason || 'Not approved by the college administrator'),
    onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ['club-approval-requests'] }), client.invalidateQueries({ queryKey: ['my-club-requests'] }), client.invalidateQueries({ queryKey: ['clubs'] })]) },
  })

  if (mine.isLoading) return <div className="flex min-h-60 items-center justify-center text-gray-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading club tools…</div>
  if (mine.isError) return <p role="alert" className="text-red-700">Couldn’t load your club memberships.</p>
  const officerClubs = (mine.data || []).filter((membership) => membership.status === 'ACTIVE' && membership.roleName.toLowerCase().includes('officer'))

  return <div className="mx-auto max-w-6xl space-y-10">
    <header><p className="text-sm font-semibold uppercase tracking-wider text-primary-700">Club tools</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Manage clubs</h1><p className="mt-2 text-gray-600">Review applications and manage members for clubs where you’re an officer.</p></header>

    <section>
      <div className="mb-4"><h2 className="text-xl font-semibold">College approval queue</h2><p className="mt-1 text-sm text-gray-600">Club requests stay private to administrators until approval.</p></div>
      {adminRequests.isLoading && <p className="text-sm text-gray-500">Loading approval queue…</p>}
      {adminRequests.data && (adminRequests.data.length === 0 ? <div className="card p-6 text-sm text-gray-600">No club requests need review.</div> : <div className="grid gap-4 md:grid-cols-2">
        {adminRequests.data.map((club) => <article key={club.id} className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">{club.categoryName || 'Uncategorized'}</p><h3 className="mt-2 text-lg font-semibold">{club.name}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">{club.description}</p>
          <div className="mt-4 flex gap-2"><button className="btn-primary" disabled={decideClub.isPending} onClick={() => decideClub.mutate({ id: club.id, approve: true })}>Approve</button><button className="btn-outline" disabled={decideClub.isPending} onClick={() => { const reason = window.prompt('Reason for rejection?'); if (reason !== null) decideClub.mutate({ id: club.id, approve: false, reason }) }}>Reject</button></div>
        </article>)}
      </div>)}
      {adminRequests.isError && <p className="mt-2 text-sm text-gray-500">Administrator approval tools are only available to authorized college administrators.</p>}
      {decideClub.isError && <p role="alert" className="mt-3 text-sm text-red-700">The decision could not be saved.</p>}
    </section>

    <section>
      <h2 className="mb-4 text-xl font-semibold">Officer dashboards</h2>
      {officerClubs.length === 0 ? <div className="card flex items-center gap-4 p-6 text-sm text-gray-600"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100"><Users className="h-5 w-5" /></span>You don’t have officer access to a club yet. Officers can review applications and manage member roles here.</div> : <div className="space-y-6">{officerClubs.map((membership) => <OfficerPanel key={membership.clubId} clubId={membership.clubId} clubName={membership.clubName} />)}</div>}
    </section>
  </div>
}

function OfficerPanel({ clubId, clubName }: { clubId: string; clubName: string }) {
  const client = useQueryClient()
  const requests = useQuery({ queryKey: ['membership-requests', clubId], queryFn: () => clubsApi.membershipRequests(clubId), retry: false })
  const members = useQuery({ queryKey: ['club-members', clubId], queryFn: () => clubsApi.members(clubId), retry: false })
  const roles = useQuery({ queryKey: ['club-roles', clubId], queryFn: () => clubsApi.roles(clubId), retry: false })
  const decide = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => clubsApi.decideMembership(id, approve),
    onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ['membership-requests', clubId] }), client.invalidateQueries({ queryKey: ['club-members', clubId] }), client.invalidateQueries({ queryKey: ['my-clubs'] })]) },
  })
  const assign = useMutation({
    mutationFn: ({ id, roleId }: { id: string; roleId: string }) => clubsApi.assignRole(id, roleId),
    onSuccess: () => client.invalidateQueries({ queryKey: ['club-members', clubId] }),
  })

  return <section className="card overflow-hidden">
    <header className="border-b border-gray-200 bg-gray-50 px-5 py-4"><h3 className="font-semibold">{clubName}</h3><p className="text-sm text-gray-600">Membership requests and current members</p></header>
    <div className="grid gap-6 p-5 lg:grid-cols-2">
      <div>
        <h4 className="font-semibold">Applications {requests.data ? `(${requests.data.length})` : ''}</h4>
        {requests.isLoading && <p className="mt-3 text-sm text-gray-500">Loading requests…</p>}
        {requests.isError && <p className="mt-3 text-sm text-gray-500">No officer access to review this club.</p>}
        {requests.data?.length === 0 && <p className="mt-3 text-sm text-gray-500">No applications waiting.</p>}
        <ul className="mt-3 divide-y divide-gray-100">{requests.data?.map((request) => <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div><p className="font-medium">{request.displayName}</p><p className="text-xs text-gray-500">Applied {new Date(request.appliedAt).toLocaleDateString()}</p></div>
          <div className="flex gap-2"><button className="btn-primary !px-3 !py-1.5" disabled={decide.isPending} onClick={() => decide.mutate({ id: request.id, approve: true })}>Approve</button><button className="btn-outline !px-3 !py-1.5" disabled={decide.isPending} onClick={() => decide.mutate({ id: request.id, approve: false })}>Reject</button></div>
        </li>)}</ul>
        {decide.isError && <p role="alert" className="mt-2 text-sm text-red-700">Decision failed. Refresh and try again.</p>}
      </div>
      <div>
        <h4 className="font-semibold">Members {members.data ? `(${members.data.length})` : ''}</h4>
        {members.isLoading && <p className="mt-3 text-sm text-gray-500">Loading members…</p>}
        {members.isError && <p className="mt-3 text-sm text-gray-500">Member list unavailable.</p>}
        <ul className="mt-3 divide-y divide-gray-100">{members.data?.map((member) => <MemberRow key={member.id} member={member} roles={roles.data || []} onRole={(roleId) => assign.mutate({ id: member.id, roleId })} busy={assign.isPending} />)}</ul>
        {assign.isError && <p role="alert" className="mt-2 text-sm text-red-700">Role change failed.</p>}
      </div>
    </div>
  </section>
}

function MemberRow({ member, roles, onRole, busy }: { member: Membership; roles: { id: string; name: string; displayName: string }[]; onRole: (roleId: string) => void; busy: boolean }) {
  return <li className="flex flex-wrap items-center justify-between gap-3 py-3">
    <div><p className="font-medium">{member.displayName}</p><p className="text-xs text-gray-500">{member.roleName}</p></div>
    <label><span className="sr-only">Role for {member.displayName}</span><select className="input !h-9 min-w-32" value={member.roleId || ''} disabled={busy || !roles.length} onChange={(event) => onRole(event.target.value)}>
      {roles.map((role) => <option key={role.id} value={role.id}>{role.displayName}</option>)}
    </select></label>
  </li>
}
