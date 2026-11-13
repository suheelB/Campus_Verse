import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, Loader2, Mail, Users } from 'lucide-react'
import { clubsApi } from '@/services/clubsApi'

export function ClubDetailPage() {
  const { id = '' } = useParams()
  const client = useQueryClient()
  const [notice, setNotice] = useState('')
  const club = useQuery({ queryKey: ['club', id], queryFn: () => clubsApi.get(id), enabled: !!id })
  const memberships = useQuery({ queryKey: ['my-clubs'], queryFn: clubsApi.myMemberships })
  const current = memberships.data?.find((item) => item.clubId === id)
  const apply = useMutation({
    mutationFn: () => clubsApi.apply(id),
    onSuccess: async (result) => {
      setNotice(result.status === 'ACTIVE' ? 'You joined this club.' : 'Your membership application was submitted.')
      await client.invalidateQueries({ queryKey: ['my-clubs'] })
    },
    onError: (error: any) => setNotice(error.response?.data?.message || 'Could not apply. Please try again.'),
  })
  const leave = useMutation({
    mutationFn: () => clubsApi.leave(id),
    onSuccess: async () => {
      setNotice('You left the club.')
      await client.invalidateQueries({ queryKey: ['my-clubs'] })
    },
    onError: (error: any) => setNotice(error.response?.data?.message || 'Could not leave this club.'),
  })

  if (club.isLoading) return <div className="flex min-h-60 items-center justify-center text-gray-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading club…</div>
  if (club.isError || !club.data) return <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-white p-8 text-center"><p role="alert" className="text-red-700">We couldn’t find this club.</p><Link className="btn-outline mt-4" to="/clubs">Back to clubs</Link></div>

  const item = club.data
  return <div className="mx-auto max-w-5xl space-y-7">
    <Link to="/clubs" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary-700"><ArrowLeft className="h-4 w-4" />All clubs</Link>
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 px-6 py-10 text-white sm:px-10">
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{item.categoryName || 'Campus community'}</span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">{item.name}</h1>
        <p className="mt-4 max-w-2xl leading-7 text-white/80">{item.shortDescription || item.description}</p>
      </div>
      <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[1fr_17rem]">
        <div>
          <h2 className="text-lg font-semibold">About this club</h2>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-600">{item.description || 'The club has not added a description yet.'}</p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600">
            <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-primary-700" />{item.memberCount} active members</span>
            {item.createdAt && <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary-700" />Requested {new Date(item.createdAt).toLocaleDateString()}</span>}
            {item.contactEmail && <a className="inline-flex items-center gap-2 hover:text-primary-700" href={`mailto:${item.contactEmail}`}><Mail className="h-4 w-4" />Contact</a>}
          </div>
        </div>
        <aside className="h-fit rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h2 className="font-semibold">Membership</h2>
          {notice && <p role="status" className="mt-3 rounded-lg bg-primary-50 p-3 text-sm text-primary-900">{notice}</p>}
          {!current && <>
            <p className="mt-2 text-sm leading-6 text-gray-600">{item.status === 'ACTIVE' ? 'Apply to join this community.' : 'This club is awaiting college approval.'}</p>
            {item.status === 'ACTIVE' && <button className="btn-primary mt-5 w-full" disabled={apply.isPending || memberships.isLoading} onClick={() => apply.mutate()}>{apply.isPending ? 'Submitting…' : 'Apply to join'}</button>}
          </>}
          {current?.status === 'PENDING' && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Your application is waiting for an officer’s decision.</p>}
          {current?.status === 'ACTIVE' && <>
            <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">You’re a member · {current.roleName}</p>
            <button className="btn-outline mt-4 w-full" disabled={leave.isPending} onClick={() => { if (window.confirm(`Leave ${item.name}?`)) leave.mutate() }}>{leave.isPending ? 'Leaving…' : 'Leave club'}</button>
          </>}
          {current?.status === 'REJECTED' && <>
            <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-900">Your previous application was declined{current.rejectionReason ? `: ${current.rejectionReason}` : '.'}</p>
            {item.status === 'ACTIVE' && <button className="btn-primary mt-4 w-full" disabled={apply.isPending} onClick={() => apply.mutate()}>{apply.isPending ? 'Submitting…' : 'Apply again'}</button>}
          </>}
          {current?.status === 'LEFT' && <button className="btn-primary mt-4 w-full" disabled={apply.isPending} onClick={() => apply.mutate()}>{apply.isPending ? 'Submitting…' : 'Rejoin club'}</button>}
        </aside>
      </div>
    </section>
  </div>
}
