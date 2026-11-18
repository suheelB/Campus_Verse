import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Loader2, Plus, Search, Users } from 'lucide-react'
import { clubsApi } from '@/services/clubsApi'
import { apiErrorMessage } from '@/services/api'
import type { Club } from '@/types/club'

export function ClubsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(0)
  const [showRequest, setShowRequest] = useState(false)
  const [notice, setNotice] = useState('')
  const clubs = useQuery({ queryKey: ['clubs', search, category, page], queryFn: () => clubsApi.list({ search, category: category || undefined, page }) })
  const categories = useQuery({ queryKey: ['club-categories'], queryFn: clubsApi.categories })
  const requestClub = useMutation({
    mutationFn: clubsApi.request,
    onSuccess: async (club) => {
      setNotice(`“${club.name}” was sent for college approval.`)
      setShowRequest(false)
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['clubs'] }), queryClient.invalidateQueries({ queryKey: ['my-clubs'] })])
    },
    onError: (error: unknown) => setNotice(apiErrorMessage(error, 'Could not submit the club request. Try again.')),
  })

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    requestClub.mutate({
      name: String(form.get('name')).trim(),
      description: String(form.get('description')).trim(),
      categorySlug: String(form.get('categorySlug') || '') || undefined,
      contactEmail: String(form.get('contactEmail') || '') || undefined,
    })
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-700">Find your people</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">Club directory</h1>
          <p className="mt-2 max-w-xl text-gray-600">Explore student communities at your college and apply to join.</p>
        </div>
        <button className="btn-primary gap-2" onClick={() => { setShowRequest((open) => !open); setNotice('') }}>
          <Plus className="h-4 w-4" /> Request a club
        </button>
      </header>

      {notice && <p role="status" className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-900">{notice}</p>}

      {showRequest && <section className="card p-5 sm:p-7" aria-labelledby="club-request-title">
        <div className="mb-5">
          <h2 id="club-request-title" className="text-xl font-semibold">Request a new club</h2>
          <p className="mt-1 text-sm text-gray-600">A college administrator must approve it before students can discover it.</p>
        </div>
        <form onSubmit={submitRequest} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="label">Club name</span>
            <input className="input" name="name" required maxLength={255} placeholder="e.g. Robotics Society" />
          </label>
          <label className="space-y-1.5">
            <span className="label">Category</span>
            <select className="input" name="categorySlug" defaultValue="">
              <option value="">Choose a category</option>
              {categories.data?.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="label">What is this club about?</span>
            <textarea className="input h-32 resize-y" name="description" required minLength={10} maxLength={10000} placeholder="Describe the club's purpose and activities" />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="label">Contact email <span className="font-normal text-gray-500">(optional)</span></span>
            <input className="input" name="contactEmail" type="email" maxLength={255} placeholder="club@college.edu" />
          </label>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button className="btn-primary" type="submit" disabled={requestClub.isPending}>{requestClub.isPending ? 'Sending request…' : 'Send for approval'}</button>
            <button className="btn-outline" type="button" onClick={() => setShowRequest(false)}>Cancel</button>
          </div>
        </form>
      </section>}

      <section className="card p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_15rem]">
          <label className="relative block">
            <span className="sr-only">Search clubs</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input className="input pl-10" type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} placeholder="Search names or descriptions" />
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select className="input" value={category} onChange={(e) => { setCategory(e.target.value); setPage(0) }}>
              <option value="">All categories</option>
              {categories.data?.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
            </select>
          </label>
        </div>
      </section>

      {clubs.isLoading ? <div className="flex min-h-48 items-center justify-center text-gray-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading clubs…</div> : null}
      {clubs.isError && <div role="alert" className="card p-8 text-center"><p className="font-medium text-red-700">Couldn’t load clubs.</p><button className="btn-outline mt-4" onClick={() => void clubs.refetch()}>Try again</button></div>}
      {clubs.data?.content.length === 0 && <div className="card px-6 py-14 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100"><Search className="h-5 w-5 text-gray-500" /></div><h2 className="mt-4 text-lg font-semibold">No clubs match that search</h2><p className="mt-1 text-sm text-gray-600">Try a different term or category, or request a new club.</p></div>}

      {!!clubs.data?.content.length && <>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {clubs.data.content.map((club) => <ClubCard key={club.id} club={club} />)}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">{clubs.data.totalElements} clubs · Page {clubs.data.number + 1} of {Math.max(1, clubs.data.totalPages)}</p>
          <div className="flex gap-2">
            <button className="btn-outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Previous</button>
            <button className="btn-outline" disabled={page + 1 >= clubs.data.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
          </div>
        </div>
      </>}
    </div>
  )
}

function ClubCard({ club }: { club: Club }) {
  return <article className="card flex min-h-60 flex-col p-6 transition-shadow hover:shadow-md">
    <div className="flex items-start justify-between gap-3">
      <span className="badge-primary">{club.categoryName || 'Student community'}</span>
      <span className="inline-flex items-center gap-1 text-xs text-gray-500"><Users className="h-3.5 w-3.5" />{club.memberCount} members</span>
    </div>
    <h2 className="mt-5 text-xl font-semibold text-gray-950">{club.name}</h2>
    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-gray-600">{club.shortDescription || club.description || 'A campus community.'}</p>
    <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-900" to={`/clubs/${club.id}`}>
      View club <ArrowRight className="h-4 w-4" />
    </Link>
  </article>
}
