import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authFetch } from '../../api/client.js'
import { PageTransition } from '../../components/PageTransition.js'

interface User {
  id: string
  full_name: string
  email: string
  employee_id: string | null
  is_active: boolean
  created_at: string
}

interface UsersResult {
  rows: User[]
  total: number
}

function fetchUsers(page: number, search: string): Promise<UsersResult> {
  const qs = new URLSearchParams({ page: String(page), page_size: '20' })
  if (search) qs.set('search', search)
  return authFetch<UsersResult>(`/users?${qs.toString()}`)
}

function deactivateUser(id: string): Promise<void> {
  return authFetch<void>(`/users/${id}/deactivate`, { method: 'PATCH' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function UserManagementPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', page, debouncedSearch],
    queryFn: () => fetchUsers(page, debouncedSearch),
    staleTime: 30_000,
  })

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['admin-users'] }) },
  })

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPage(1)
    clearTimeout((window as unknown as { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer)
    ;(window as unknown as { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => {
      setDebouncedSearch(val)
    }, 300)
  }

  const totalPages = data ? Math.ceil(data.total / 20) : 1

  return (
    <PageTransition>
      <div className="max-w-5xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">User Management</h1>
            <p className="text-sm text-slate-400">View and manage platform users</p>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search name or email…"
            className="w-64 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        {isLoading && (
          <div className="glass rounded-2xl overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-white/5 animate-pulse">
                <div className="h-4 w-32 bg-white/5 rounded" />
                <div className="h-4 w-48 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="glass rounded-2xl p-8 text-center text-red-400 text-sm">
            Failed to load users.
          </div>
        )}

        {data && data.rows.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-slate-300 font-medium">No users found</p>
          </div>
        )}

        {data && data.rows.length > 0 && (
          <>
            <div className="glass rounded-2xl overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Name</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Email</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Employee ID</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Joined</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((u, idx) => (
                    <tr key={u.id} className={idx < data.rows.length - 1 ? 'border-b border-white/5' : ''}>
                      <td className="px-5 py-3 text-white font-medium">{u.full_name}</td>
                      <td className="px-5 py-3 text-slate-400">{u.email}</td>
                      <td className="px-5 py-3 text-slate-500 font-mono text-xs">{u.employee_id ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-500">{fmtDate(u.created_at)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          u.is_active
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20'
                            : 'bg-slate-500/15 text-slate-400 border-slate-500/20'
                        }`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {u.is_active && (
                          <button
                            onClick={() => deactivateMutation.mutate(u.id)}
                            disabled={deactivateMutation.isPending}
                            className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>{data.total} users total</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg disabled:opacity-40 hover:bg-white/10 transition-all"
                  >
                    Prev
                  </button>
                  <span className="text-slate-400">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg disabled:opacity-40 hover:bg-white/10 transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  )
}
