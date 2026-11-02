import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authFetchList } from '../../api/client.js'
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

function fetchEntity(type: EntityType, page: number): Promise<EntityResult> {
  return authFetchList<EntityRow>(`/master/${type}?page=${page}&page_size=20`)
}

export function MasterDataPage() {
  const [activeEntity, setActiveEntity] = useState<EntityType>('plants')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-master', activeEntity, page],
    queryFn: () => fetchEntity(activeEntity, page),
    staleTime: 60_000,
  })

  const handleEntityChange = (key: EntityType) => {
    setActiveEntity(key)
    setPage(1)
  }

  const totalPages = data ? Math.ceil(data.total / 20) : 1

  return (
    <PageTransition>
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Master Data</h1>
          <p className="text-sm text-slate-400">View all master data entities</p>
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
            <p className="text-slate-400">No {ENTITIES.find((e) => e.key === activeEntity)?.label ?? activeEntity} found</p>
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
    </PageTransition>
  )
}
