import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getIdea, deleteIdea, getIdeaWorkflowStatus, submitIdeaWorkflowAction } from '../../api/ideas.js'
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

  const [actionComment, setActionComment] = useState('')
  const [commentError, setCommentError] = useState(false)
  const [flags, setFlags] = useState({ safety_review_required: false, qms_review_required: false, machine_design_change: false })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => getIdea(id!),
    enabled: !!id,
  })

  const idea = data?.data
  const hasWorkflow = !!idea?.workflow_instance_id

  const { data: wfStatus } = useQuery({
    queryKey: ['idea-workflow-status', id],
    queryFn: () => getIdeaWorkflowStatus(id!),
    enabled: !!id && hasWorkflow,
  })

  // Find the step currently assigned to this user that is PENDING
  const myPendingStep = wfStatus?.steps.find(
    (s) => s.assigned_to.id === user?.id && s.status === 'PENDING',
  )
  const isHodStep = myPendingStep?.stage_code === 'HOD_REVIEW'

  const actionMutation = useMutation({
    mutationFn: (payload: { action: 'APPROVE' | 'RETURN' | 'REJECT' }) =>
      submitIdeaWorkflowAction(id!, {
        ...payload,
        comment: actionComment.trim() || undefined,
        flags: isHodStep ? flags : undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['idea', id] })
      void queryClient.invalidateQueries({ queryKey: ['idea-workflow-status', id] })
      void queryClient.invalidateQueries({ queryKey: ['idea-timeline', id] })
      void queryClient.invalidateQueries({ queryKey: ['my-ideas'] })
      void queryClient.invalidateQueries({ queryKey: ['my-review-queue'] })
      setActionComment('')
      setCommentError(false)
      addToast('Action submitted successfully', 'success')
    },
    onError: (err: Error) => addToast(err.message, 'error'),
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

  const ideaData = data.data
  const isOwner = user?.id === ideaData.submitted_by?.id
  const isDraft = ideaData.status === 'DRAFT'
  const sc = STATUS_CONFIG[ideaData.status] ?? STATUS_CONFIG['DRAFT']!

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
                    {ideaData.registration_id ?? 'DRAFT'}
                  </span>
                  <h1 className="text-xl font-bold text-white leading-snug">{ideaData.title}</h1>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0 ${sc.cls}`}>
                  <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                  {sc.label}
                </span>
              </div>
              <ContentSection label="Description" value={ideaData.description} />
            </div>

            {/* Problem / Idea content */}
            <div className="glass rounded-2xl p-6 space-y-5">
              <ContentSection label="Problem Statement" value={ideaData.problem_statement} />
              {ideaData.proposed_solution && (
                <>
                  <div className="border-t border-white/5" />
                  <ContentSection label="Proposed Solution" value={ideaData.proposed_solution} />
                </>
              )}
              {ideaData.expected_benefits && (
                <>
                  <div className="border-t border-white/5" />
                  <ContentSection label="Expected Benefits" value={ideaData.expected_benefits} />
                </>
              )}
              {ideaData.remarks && (
                <>
                  <div className="border-t border-white/5" />
                  <ContentSection label="Remarks" value={ideaData.remarks} />
                </>
              )}
            </div>

            {/* Tags */}
            {ideaData.tags && ideaData.tags.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {ideaData.tags.map((tag) => (
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
            {ideaData.attachments && ideaData.attachments.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Attachments</p>
                <div className="space-y-2">
                  {ideaData.attachments.map((att) => (
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
                <MetaRow label="Submitted By" value={ideaData.is_anonymous ? 'Anonymous' : (ideaData.submitted_by?.full_name ?? '—')} />
                <MetaRow label="Plant"      value={ideaData.plant?.name} />
                <MetaRow label="Zone"       value={ideaData.zone?.name} />
                <MetaRow label="Department" value={ideaData.department?.name} />
                {ideaData.function   && <MetaRow label="Function"     value={ideaData.function.name} />}
                {ideaData.hall       && <MetaRow label="Hall"         value={ideaData.hall.name} />}
                {ideaData.location   && <MetaRow label="Location"     value={ideaData.location.name} />}
                <MetaRow label="Category"   value={ideaData.category?.name} />
                {ideaData.sub_category && <MetaRow label="Sub-Category" value={ideaData.sub_category.name} />}
                <MetaRow
                  label="Submitted"
                  value={
                    ideaData.submitted_at
                      ? new Date(ideaData.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'
                  }
                />
              </div>
            </div>

            {/* Workflow action panel — only visible when current user is the assigned reviewer */}
            {myPendingStep && (
              <div className="glass rounded-2xl p-5 border border-indigo-500/20">
                <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mb-4">
                  Your Review — {myPendingStep.stage_code.replace(/_/g, ' ')}
                </p>

                {/* HOD flags */}
                {isHodStep && (
                  <div className="mb-4 space-y-2">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Set Flags</p>
                    {[
                      { key: 'safety_review_required', label: 'Safety Review Required' },
                      { key: 'qms_review_required',    label: 'QMS Review Required' },
                      { key: 'machine_design_change',  label: 'Machine Design Change' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={flags[key as keyof typeof flags]}
                          onChange={(e) => setFlags((f) => ({ ...f, [key]: e.target.checked }))}
                          className="w-4 h-4 rounded accent-indigo-500"
                        />
                        <span className="text-sm text-slate-300">{label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Comment */}
                <textarea
                  value={actionComment}
                  onChange={(e) => { setActionComment(e.target.value); if (e.target.value.trim()) setCommentError(false) }}
                  placeholder="Add a comment (required for Return / Reject)"
                  rows={3}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all resize-none mb-1 ${commentError ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-indigo-500/50'}`}
                />
                {commentError && (
                  <p className="text-xs text-red-400 mb-3">A comment is required when returning or rejecting.</p>
                )}
                {!commentError && <div className="mb-3" />}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => actionMutation.mutate({ action: 'APPROVE' })}
                    disabled={actionMutation.isPending}
                    className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      if (!actionComment.trim()) { setCommentError(true); return }
                      actionMutation.mutate({ action: 'RETURN' })
                    }}
                    disabled={actionMutation.isPending}
                    className="flex-1 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                  >
                    Return
                  </button>
                  <button
                    onClick={() => {
                      if (!actionComment.trim()) { setCommentError(true); return }
                      actionMutation.mutate({ action: 'REJECT' })
                    }}
                    disabled={actionMutation.isPending}
                    className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* Workflow timeline */}
            {ideaData.workflow_instance_id && (
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
