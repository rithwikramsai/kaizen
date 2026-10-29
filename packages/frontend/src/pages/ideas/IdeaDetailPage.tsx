import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getIdea, deleteIdea } from '../../api/ideas.js'
import { WorkflowTimeline } from '../../components/WorkflowTimeline.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../hooks/useToast.js'
import { SkeletonDetail } from '../../components/Skeleton.js'
import { PageTransition } from '../../components/PageTransition.js'

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  SUBMITTED: { label: 'Submitted', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',     dot: 'bg-amber-400' },
  APPROVED:  { label: 'Approved',  cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', dot: 'bg-emerald-400' },
  REJECTED:  { label: 'Rejected',  cls: 'bg-red-500/15 text-red-400 border border-red-500/30',           dot: 'bg-red-400' },
  DRAFT:     { label: 'Draft',     cls: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',     dot: 'bg-slate-400' },
}

function BackIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function PaperclipIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

export function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => getIdea(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteIdea(id!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-ideas'] })
      addToast('Idea deleted successfully', 'success')
      navigate('/ideas')
    },
    onError: () => addToast('Failed to delete idea', 'error'),
  })

  if (isLoading) {
    return (
      <PageTransition>
        <div className="max-w-5xl">
          <SkeletonDetail />
        </div>
      </PageTransition>
    )
  }

  if (isError || !data) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-red-400 text-sm mb-4">Idea not found.</p>
          <button onClick={() => navigate('/ideas')} className="text-indigo-400 text-sm hover:underline">
            ← Back to ideas
          </button>
        </div>
      </PageTransition>
    )
  }

  const idea = data.data
  const isOwner = user?.id === idea.submitted_by?.id
  const isDraft = idea.status === 'DRAFT'
  const sc = STATUS_CONFIG[idea.status] ?? STATUS_CONFIG['DRAFT']!

  const handleDelete = () => {
    if (confirm('Delete this idea? This cannot be undone.')) {
      deleteMutation.mutate()
    }
  }

  return (
    <PageTransition>
      <div className="max-w-6xl">
        {/* Back nav */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <BackIcon /> Back
        </button>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left: main content (2 cols) ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Title card */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="flex-1">
                  <span className="text-[11px] font-mono text-slate-500 bg-white/5 border border-white/8 px-2 py-0.5 rounded-md inline-block mb-2">
                    {idea.registration_id ?? 'DRAFT'}
                  </span>
                  <h1 className="text-xl font-bold text-white leading-snug">{idea.title}</h1>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0 ${sc.cls}`}>
                  <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                  {sc.label}
                </span>
              </div>
              <ContentSection label="Description" value={idea.description} />
            </div>

            {/* Problem / Solution */}
            <div className="glass rounded-2xl p-6 space-y-5">
              <ContentSection label="Problem Statement" value={idea.problem_statement} />
              <div className="border-t border-white/5" />
              <ContentSection label="Proposed Solution" value={idea.proposed_solution} />
              {idea.expected_benefits && (
                <>
                  <div className="border-t border-white/5" />
                  <ContentSection label="Expected Benefits" value={idea.expected_benefits} />
                </>
              )}
            </div>

            {/* Tags */}
            {idea.tags && idea.tags.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {idea.tags.map((tag) => (
                    <span
                      key={tag.id}
                      style={{
                        backgroundColor: (tag.color ?? '#6366f1') + '25',
                        color: tag.color ?? '#6366f1',
                        borderColor: (tag.color ?? '#6366f1') + '50',
                      } as React.CSSProperties}
                      className="text-xs font-medium px-3 py-1 rounded-full border"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {idea.attachments && idea.attachments.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Attachments</p>
                <div className="space-y-2">
                  {idea.attachments.map((att) => (
                    <div key={att.file_id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                      <span className="text-indigo-400"><PaperclipIcon /></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate">{att.file_name}</p>
                        <p className="text-xs text-slate-500">{att.content_type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Draft actions */}
            {isDraft && isOwner && (
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/ideas/${id}/edit`)}
                  className="px-5 py-2.5 glass rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  Edit Draft
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 transition-all disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            )}
          </div>

          {/* ── Right: metadata + timeline ── */}
          <div className="space-y-4">

            {/* Metadata */}
            <div className="glass rounded-2xl p-5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Details</p>
              <div className="space-y-2.5">
                <MetaRow label="Submitted By" value={idea.is_anonymous ? 'Anonymous' : (idea.submitted_by?.full_name ?? '—')} />
                <MetaRow label="Plant"      value={idea.plant?.name} />
                <MetaRow label="Zone"       value={idea.zone?.name} />
                <MetaRow label="Department" value={idea.department?.name} />
                {idea.function   && <MetaRow label="Function"     value={idea.function.name} />}
                {idea.hall       && <MetaRow label="Hall"         value={idea.hall.name} />}
                {idea.location   && <MetaRow label="Location"     value={idea.location.name} />}
                <MetaRow label="Category"   value={idea.category?.name} />
                {idea.sub_category && <MetaRow label="Sub-Category" value={idea.sub_category.name} />}
                <MetaRow
                  label="Submitted"
                  value={
                    idea.submitted_at
                      ? new Date(idea.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'
                  }
                />
              </div>
            </div>

            {/* Workflow timeline */}
            {idea.workflow_instance_id && (
              <div className="glass rounded-2xl p-5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Workflow</p>
                <WorkflowTimeline ideaId={id!} />
              </div>
            )}
          </div>

        </div>
      </div>
    </PageTransition>
  )
}

function ContentSection({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-xs text-slate-200 text-right">{value ?? '—'}</span>
    </div>
  )
}
