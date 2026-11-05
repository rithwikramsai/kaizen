import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authFetch, authFetchList } from '../../api/client.js'
import { PageTransition } from '../../components/PageTransition.js'

type EntityType = 'plants' | 'zones' | 'departments' | 'functions' | 'halls' | 'locations' | 'categories' | 'sub_categories' | 'tags'

interface EntityRow {
  id: string
  name: string
  is_active?: boolean
  code?: string
}

interface EntityResult {
  rows: EntityRow[]
  total: number
}

const ENTITIES: { key: EntityType; label: string }[] = [
  { key: 'plants',         label: 'Plants' },
  { key: 'zones',          label: 'Zones' },
  { key: 'departments',    label: 'Departments' },
  { key: 'functions',      label: 'Functions' },
  { key: 'halls',          label: 'Halls' },
  { key: 'locations',      label: 'Locations' },
  { key: 'categories',     label: 'Categories' },
  { key: 'sub_categories', label: 'Sub-Categories' },
  { key: 'tags',           label: 'Tags' },
]

const ENTITIES_WITH_CODE: Set<EntityType> = new Set([
  'plants', 'zones', 'departments', 'functions', 'halls', 'locations', 'categories', 'sub_categories',
])

function entityPath(key: EntityType): string {
  return key.replace('_', '-')
}

function fetchEntity(type: EntityType, page: number): Promise<EntityResult> {
  return authFetchList<EntityRow>(`/master/${entityPath(type)}?page=${page}&page_size=20`)
}

function createEntity(type: EntityType, payload: { name: string; code?: string }): Promise<EntityRow> {
  return authFetch<EntityRow>(`/master/${entityPath(type)}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function updateEntity(type: EntityType, id: string, payload: { name: string; code?: string }): Promise<EntityRow> {
  return authFetch<EntityRow>(`/master/${entityPath(type)}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

function deleteEntity(type: EntityType, id: string): Promise<void> {
  return authFetch<void>(`/master/${entityPath(type)}/${id}`, { method: 'DELETE' })
}

interface ModalState {
  mode: 'create' | 'edit'
  row?: EntityRow
}

function EntityModal({
  entityType,
  state,
  onClose,
  onSaved,
}: {
  entityType: EntityType
  state: ModalState
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(state.row?.name ?? '')
  const [code, setCode] = useState(state.row?.code ?? '')
  const hasCode = ENTITIES_WITH_CODE.has(entityType)

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { name: name.trim(), ...(hasCode && code.trim() ? { code: code.trim() } : {}) }
      return state.mode === 'create'
        ? createEntity(entityType, payload)
        : updateEntity(entityType, state.row!.id, payload)
    },
    onSuccess: () => { onSaved(); onClose() },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-semibold text-base mb-5">
          {state.mode === 'create' ? 'New' : 'Edit'} {ENTITIES.find((e) => e.key === entityType)?.label ?? entityType}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              autoFocus
            />
          </div>
          {hasCode && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 font-mono"
                placeholder="e.g. PLT01"
              />
            </div>
          )}
        </div>

        {mutation.isError && (
          <p className="text-red-400 text-xs mt-3">{(mutation.error as Error).message}</p>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/5 border border-white/10 text-slate-400 text-sm rounded-lg hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
            className="px-4 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm rounded-lg hover:bg-indigo-600/30 transition-all disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function MasterDataPage() {
  const [activeEntity, setActiveEntity] = useState<EntityType>('plants')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EntityRow | null>(null)
  const queryClient = useQueryClient()

  const queryKey = ['admin-master', activeEntity, page]

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => fetchEntity(activeEntity, page),
    staleTime: 60_000,
  })

  const deleteMutation = useMutation({
    mutationFn: (row: EntityRow) => deleteEntity(activeEntity, row.id),
    onSuccess: () => {
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['admin-master', activeEntity] })
    },
  })

  const invalidate = () => { void queryClient.invalidateQueries({ queryKey: ['admin-master', activeEntity] }) }

  const handleEntityChange = (key: EntityType) => {
    setActiveEntity(key)
    setPage(1)
  }

  const totalPages = data ? Math.ceil(data.total / 20) : 1

  return (
    <PageTransition>
      <div className="max-w-5xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Master Data</h1>
            <p className="text-sm text-slate-400">Manage all master data entities</p>
          </div>
          <button
            onClick={() => setModal({ mode: 'create' })}
            className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium rounded-lg hover:bg-indigo-600/30 transition-all"
          >
            + New
          </button>
        </div>

        <div className="flex gap-2 flex-wrap mb-5">
          {ENTITIES.map((e) => (
            <button
              key={e.key}
              onClick={() => handleEntityChange(e.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                activeEntity === e.key
                  ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/8'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="glass rounded-2xl p-8">
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {isError && (
          <div className="glass rounded-2xl p-8 text-center text-red-400 text-sm">
            Failed to load data.
          </div>
        )}

        {data && data.rows.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-slate-400 mb-4">No {ENTITIES.find((e) => e.key === activeEntity)?.label ?? activeEntity} found</p>
            <button
              onClick={() => setModal({ mode: 'create' })}
              className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm rounded-lg hover:bg-indigo-600/30 transition-all"
            >
              + Add first entry
            </button>
          </div>
        )}

        {data && data.rows.length > 0 && (
          <>
            <div className="glass rounded-2xl overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Name</th>
                    {data.rows[0]?.code !== undefined && (
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Code</th>
                    )}
                    {data.rows[0]?.is_active !== undefined && (
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                    )}
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, idx) => (
                    <tr key={row.id} className={idx < data.rows.length - 1 ? 'border-b border-white/5' : ''}>
                      <td className="px-5 py-3 text-white">{row.name}</td>
                      {row.code !== undefined && (
                        <td className="px-5 py-3 text-slate-400 font-mono text-xs">{row.code}</td>
                      )}
                      {row.is_active !== undefined && (
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            row.is_active
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20'
                              : 'bg-slate-500/15 text-slate-400 border-slate-500/20'
                          }`}>
                            {row.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      )}
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setModal({ mode: 'edit', row })}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(row)}
                            className="text-[11px] text-red-400 hover:text-red-300 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>{data.total} records</span>
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

      {modal && (
        <EntityModal
          entityType={activeEntity}
          state={modal}
          onClose={() => setModal(null)}
          onSaved={invalidate}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div
            className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-semibold text-base mb-2">Delete entry?</h3>
            <p className="text-slate-400 text-sm mb-5">
              This will permanently delete <span className="text-white font-medium">{deleteTarget.name}</span>. This action cannot be undone.
            </p>
            {deleteMutation.isError && (
              <p className="text-red-400 text-xs mb-3">{(deleteMutation.error as Error).message}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-1.5 bg-white/5 border border-white/10 text-slate-400 text-sm rounded-lg hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget)}
                disabled={deleteMutation.isPending}
                className="px-4 py-1.5 bg-red-500/15 border border-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/25 transition-all disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  )
}
