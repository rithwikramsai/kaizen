import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authFetch, authFetchList, API_BASE, TOKEN_KEY } from '../../api/client.js'
import { PageTransition } from '../../components/PageTransition.js'

interface User {
  id: string
  full_name: string
  email: string
  employee_id: string | null
  is_active: boolean
  created_at: string
}

interface Role { id: string; name: string; description: string | null }
interface UserRole { id: string; role_id: string; role_name: string; plant_id: string; plant_name: string | null; zone_id: string | null; granted_at: string }

function fetchRoles(): Promise<Role[]> {
  return authFetch<Role[]>('/roles')
}

function fetchUserRoles(userId: string): Promise<UserRole[]> {
  return authFetch<UserRole[]>(`/users/${userId}/roles`)
}

function assignUserRole(userId: string, roleId: string, plantId: string): Promise<void> {
  return authFetch<void>(`/users/${userId}/roles`, {
    method: 'POST',
    body: JSON.stringify({ role_id: roleId, plant_id: plantId }),
  })
}

function revokeUserRole(userId: string, roleId: string): Promise<void> {
  return authFetch<void>(`/users/${userId}/roles/${roleId}`, { method: 'DELETE' })
}

function fetchPlants(): Promise<{ id: string; name: string }[]> {
  return authFetch<{ id: string; name: string }[]>('/master/plants')
}

function RoleManagementModal({ user, onClose }: { user: User; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [selectedPlantId, setSelectedPlantId] = useState('')

  const { data: roles } = useQuery({ queryKey: ['all-roles'], queryFn: fetchRoles, staleTime: 300_000 })
  const { data: plants } = useQuery({ queryKey: ['all-plants'], queryFn: fetchPlants, staleTime: 300_000 })
  const { data: userRoles, isLoading } = useQuery({
    queryKey: ['user-roles', user.id],
    queryFn: () => fetchUserRoles(user.id),
    staleTime: 10_000,
  })

  const assignMutation = useMutation({
    mutationFn: () => assignUserRole(user.id, selectedRoleId, selectedPlantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user-roles', user.id] })
      setSelectedRoleId('')
      setSelectedPlantId('')
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (roleId: string) => revokeUserRole(user.id, roleId),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['user-roles', user.id] }) },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-white font-semibold text-base">Manage Roles</h2>
            <p className="text-slate-400 text-xs mt-0.5">{user.full_name} · {user.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg leading-none">✕</button>
        </div>

        {/* Current roles */}
        <div className="mb-5">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Current Roles</p>
          {isLoading ? (
            <div className="h-8 bg-white/5 rounded animate-pulse" />
          ) : !userRoles || userRoles.length === 0 ? (
            <p className="text-slate-500 text-xs">No roles assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {userRoles.map((ur) => (
                <div key={ur.id} className="flex items-center justify-between bg-white/5 border border-white/8 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-sm text-white font-medium">{ur.role_name}</span>
                    {ur.plant_name && <span className="text-xs text-slate-500 ml-2">@ {ur.plant_name}</span>}
                  </div>
                  <button
                    onClick={() => revokeMutation.mutate(ur.role_id)}
                    disabled={revokeMutation.isPending}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assign new role */}
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Assign Role</p>
          <div className="space-y-2">
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            >
              <option value="">Select role…</option>
              {roles?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select
              value={selectedPlantId}
              onChange={(e) => setSelectedPlantId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            >
              <option value="">Select plant…</option>
              {plants?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {assignMutation.isError && (
              <p className="text-red-400 text-xs">{(assignMutation.error as Error).message}</p>
            )}
            <button
              onClick={() => assignMutation.mutate()}
              disabled={!selectedRoleId || !selectedPlantId || assignMutation.isPending}
              className="w-full py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm rounded-lg hover:bg-indigo-600/30 transition-all disabled:opacity-50"
            >
              {assignMutation.isPending ? 'Assigning…' : 'Assign Role'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface UsersResult {
  rows: User[]
  total: number
}

function fetchUsers(page: number, search: string): Promise<UsersResult> {
  const qs = new URLSearchParams({ page: String(page), page_size: '20' })
  if (search) qs.set('search', search)
  return authFetchList<User>(`/users?${qs.toString()}`)
}

function deactivateUser(id: string): Promise<void> {
  return authFetch<void>(`/users/${id}/deactivate`, { method: 'PUT' })
}

interface ImportResult { created: number; skipped: number; errors: string[] }

async function importUsersFile(file: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  const token = localStorage.getItem(TOKEN_KEY)
  const res = await fetch(`${API_BASE}/users/import`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  const body = (await res.json()) as { success: boolean; data?: ImportResult; error?: { message: string } }
  if (!res.ok) throw new Error(body.error?.message ?? 'Import failed')
  return body.data!
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function UserManagementPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const importMutation = useMutation({
    mutationFn: importUsersFile,
    onSuccess: (result) => {
      setImportResult(result)
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

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
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search name or email…"
              className="w-52 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) { importMutation.mutate(file); e.target.value = '' }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importMutation.isPending}
              className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 text-sm font-medium rounded-lg hover:bg-white/10 transition-all disabled:opacity-50"
            >
              {importMutation.isPending ? 'Importing…' : 'Import CSV'}
            </button>
          </div>
        </div>

        {importResult && (
          <div className={`glass rounded-xl p-4 mb-4 text-sm ${importResult.errors.length > 0 ? 'border border-amber-500/20' : 'border border-emerald-500/20'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-white font-medium">Import complete</span>
              <button onClick={() => setImportResult(null)} className="text-slate-500 hover:text-slate-300 text-xs">Dismiss</button>
            </div>
            <p className="text-slate-400 text-xs">
              {importResult.created} created · {importResult.skipped} skipped
            </p>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {importResult.errors.map((e, i) => (
                  <li key={i} className="text-amber-400 text-xs">{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {importMutation.isError && (
          <div className="glass rounded-xl p-4 mb-4 border border-red-500/20 text-red-400 text-sm">
            {(importMutation.error as Error).message}
          </div>
        )}

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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setRoleModalUser(u)}
                            className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium rounded-lg hover:bg-indigo-500/20 transition-all"
                          >
                            Roles
                          </button>
                          {u.is_active && (
                            <button
                              onClick={() => deactivateMutation.mutate(u.id)}
                              disabled={deactivateMutation.isPending}
                              className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
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

      {roleModalUser && (
        <RoleManagementModal user={roleModalUser} onClose={() => setRoleModalUser(null)} />
      )}
    </PageTransition>
  )
}
