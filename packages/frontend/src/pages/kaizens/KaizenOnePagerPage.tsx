import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getKaizen, saveKaizenDraft, submitOnePager } from '../../api/kaizens.js'
import { FileUpload } from '../../components/FileUpload.js'
import { useToast } from '../../hooks/useToast.js'
import { PageTransition } from '../../components/PageTransition.js'

// ─── Schema ───────────────────────────────────────────────────────────────────

const onePagerSchema = z.object({
  title:                z.string().min(3, 'Title is required'),
  team_members:         z.string().optional(),
  business_impact:      z.string().optional(),
  before_description:   z.string().optional(),
  w1h_who:              z.string().optional(),
  w1h_what:             z.string().optional(),
  w1h_where:            z.string().optional(),
  w1h_when:             z.string().optional(),
  w1h_why:              z.string().optional(),
  w1h_how:              z.string().optional(),
  why_1:                z.string().optional(),
  why_2:                z.string().optional(),
  why_3:                z.string().optional(),
  why_4:                z.string().optional(),
  why_5:                z.string().optional(),
  root_cause_analysis:  z.string().min(1, 'Root Cause Analysis is required'),
  category_of_cause:    z.string().optional(),
  solution_implemented: z.string().min(1, 'Solution Implemented is required'),
  results:              z.string().optional(),
  after_description:    z.string().optional(),
  cost:                 z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().nullable()),
  benefit:              z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().nullable()),
  early_equipment_mgmt: z.boolean().default(false),
  applicable_documents: z.string().optional(),
  remarks:              z.string().optional(),
})

type OnePagerFormValues = z.infer<typeof onePagerSchema>

// ─── Helper components ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">{title}</h2>
      {children}
    </div>
  )
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all'
const textareaCls = `${inputCls} resize-none`

// ─── Page ─────────────────────────────────────────────────────────────────────

export function KaizenOnePagerPage() {
  const { kaizenId } = useParams<{ kaizenId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [isPreview, setIsPreview] = useState(false)

  // Attachment file IDs managed outside react-hook-form (FileUpload uses callbacks, not form fields)
  const [beforeFileIds, setBeforeFileIds] = useState<string[]>([])
  const [afterFileIds, setAfterFileIds] = useState<string[]>([])
  const [supportingFileIds, setSupportingFileIds] = useState<string[]>([])

  const { data: kaizen, isLoading } = useQuery({
    queryKey: ['kaizen', kaizenId],
    queryFn: () => getKaizen(kaizenId!),
    enabled: !!kaizenId,
  })

  // Initialise attachment state from server data (only when kaizen ID first resolves)
  useEffect(() => {
    if (!kaizen) return
    setBeforeFileIds(kaizen.attachments.filter((a) => a.attachment_type === 'BEFORE_PHOTO').map((a) => a.file_id))
    setAfterFileIds(kaizen.attachments.filter((a) => a.attachment_type === 'AFTER_PHOTO').map((a) => a.file_id))
    setSupportingFileIds(kaizen.attachments.filter((a) => a.attachment_type === 'SUPPORTING_DOC').map((a) => a.file_id))
  }, [kaizen?.id])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    getValues,
  } = useForm<OnePagerFormValues>({
    resolver: zodResolver(onePagerSchema),
    values: kaizen
      ? {
          title:                kaizen.title ?? '',
          team_members:         kaizen.team_members ?? '',
          business_impact:      kaizen.business_impact ?? '',
          before_description:   kaizen.before_description ?? '',
          w1h_who:              kaizen.w1h.who ?? '',
          w1h_what:             kaizen.w1h.what ?? '',
          w1h_where:            kaizen.w1h.where ?? '',
          w1h_when:             kaizen.w1h.when ?? '',
          w1h_why:              kaizen.w1h.why ?? '',
          w1h_how:              kaizen.w1h.how ?? '',
          why_1:                kaizen.five_why.why_1 ?? '',
          why_2:                kaizen.five_why.why_2 ?? '',
          why_3:                kaizen.five_why.why_3 ?? '',
          why_4:                kaizen.five_why.why_4 ?? '',
          why_5:                kaizen.five_why.why_5 ?? '',
          root_cause_analysis:  kaizen.root_cause_analysis ?? '',
          category_of_cause:    kaizen.category_of_cause ?? '',
          solution_implemented: kaizen.solution_implemented ?? '',
          results:              kaizen.results ?? '',
          after_description:    kaizen.after_description ?? '',
          cost:                 kaizen.cost ?? null,
          benefit:              kaizen.benefit ?? null,
          early_equipment_mgmt: kaizen.early_equipment_mgmt,
          applicable_documents: kaizen.applicable_documents ?? '',
          remarks:              kaizen.remarks ?? '',
        }
      : undefined,
  })

  const saveMutation = useMutation({
    mutationFn: (data: OnePagerFormValues) =>
      saveKaizenDraft(kaizenId!, {
        ...data,
        cost: data.cost ?? undefined,
        benefit: data.benefit ?? undefined,
        before_file_ids: beforeFileIds,
        after_file_ids: afterFileIds,
        supporting_file_ids: supportingFileIds,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['kaizen', kaizenId] })
      addToast('Draft saved', 'success')
    },
    onError: (err: Error) => addToast(err.message, 'error'),
  })

  const submitMutation = useMutation({
    mutationFn: () => submitOnePager(kaizenId!),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['kaizen', kaizenId] })
      void queryClient.invalidateQueries({ queryKey: ['approved-queue'] })
      addToast(`One Pager submitted — ${result.kaizen_id}`, 'success')
      navigate('/kaizens')
    },
    onError: (err: Error) => addToast(err.message, 'error'),
  })

  const onSave: SubmitHandler<OnePagerFormValues> = (data) => {
    saveMutation.mutate(data)
  }

  const onSubmit: SubmitHandler<OnePagerFormValues> = (data) => {
    // Save first, then submit
    saveMutation.mutate(data, {
      onSuccess: () => submitMutation.mutate(),
    })
  }

  const costVal = Number(watch('cost') ?? 0)
  const benefitVal = Number(watch('benefit') ?? 0)
  const ratio = costVal > 0 && benefitVal > 0 ? Math.round((benefitVal / costVal) * 100) / 100 : null

  const isSubmitted = kaizen?.status === 'ONE_PAGER_SUBMITTED' || kaizen?.status === 'APPROVED' || kaizen?.status === 'REJECTED'
  const isReadOnly = isSubmitted

  if (isLoading) {
    return (
      <PageTransition>
        <div className="max-w-4xl space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-6 h-40" />
          ))}
        </div>
      </PageTransition>
    )
  }

  if (!kaizen) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-red-400 text-sm mb-4">Kaizen not found.</p>
          <button onClick={() => navigate('/kaizens')} className="text-indigo-400 text-sm hover:underline">
            ← Back to queue
          </button>
        </div>
      </PageTransition>
    )
  }

  if (isPreview) {
    return <OnePagerPreview kaizen={kaizen} values={getValues()} onClose={() => setIsPreview(false)} />
  }

  return (
    <PageTransition>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <button
              onClick={() => navigate('/kaizens')}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-3 transition-colors"
            >
              ← Back to queue
            </button>
            <div className="flex items-center gap-3">
              {kaizen.kaizen_id && (
                <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                  {kaizen.kaizen_id}
                </span>
              )}
              {isSubmitted && (
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  Submitted for Review
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">{kaizen.title}</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {kaizen.idea.registration_id} · {kaizen.zone.name}
              {kaizen.implementation_owner && ` · ${kaizen.implementation_owner.full_name}`}
            </p>
          </div>
          <button
            onClick={() => setIsPreview(true)}
            className="px-4 py-2 glass hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm font-medium rounded-xl transition-all"
          >
            Preview
          </button>
        </div>

        {/* Idea context */}
        <div className="glass rounded-2xl p-5 mb-5 border border-indigo-500/15">
          <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mb-2">Problem Statement (from Idea)</p>
          <p className="text-sm text-slate-300 leading-relaxed">{kaizen.idea.problem_statement}</p>
        </div>

        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>

          {/* Basic Info */}
          <Section title="Basic Information">
            <Field label="Kaizen Title" error={errors.title?.message} required>
              <input {...register('title')} disabled={isReadOnly} placeholder="Enter kaizen title" className={inputCls} />
            </Field>
            <Field label="Team Members" error={errors.team_members?.message}>
              <textarea {...register('team_members')} disabled={isReadOnly} rows={2} placeholder="Names of team members involved" className={textareaCls} />
            </Field>
            <Field label="Business Impact" error={errors.business_impact?.message}>
              <textarea {...register('business_impact')} disabled={isReadOnly} rows={3} placeholder="Describe the business impact" className={textareaCls} />
            </Field>
          </Section>

          {/* Before State */}
          <Section title="Before State">
            <Field label="Description of Before State">
              <textarea {...register('before_description')} disabled={isReadOnly} rows={3} placeholder="Describe the situation before the improvement" className={textareaCls} />
            </Field>
          </Section>

          {/* 5W1H */}
          <Section title="5W1H Analysis">
            {(['who', 'what', 'where', 'when', 'why', 'how'] as const).map((key) => (
              <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
                <input
                  {...register(`w1h_${key}` as keyof OnePagerFormValues)}
                  disabled={isReadOnly}
                  placeholder={`Who / What / Where / When / Why / How`}
                  className={inputCls}
                />
              </Field>
            ))}
          </Section>

          {/* 5 Why */}
          <Section title="5 Why Analysis">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <Field key={n} label={`Why ${n}`}>
                <input
                  {...register(`why_${n}` as keyof OnePagerFormValues)}
                  disabled={isReadOnly}
                  placeholder={`Why ${n}...`}
                  className={inputCls}
                />
              </Field>
            ))}
          </Section>

          {/* Root Cause & Solution */}
          <Section title="Root Cause & Solution">
            <Field label="Root Cause Analysis" required error={errors.root_cause_analysis?.message}>
              <textarea {...register('root_cause_analysis')} disabled={isReadOnly} rows={3} placeholder="Describe the root cause identified" className={textareaCls} />
            </Field>
            <Field label="Category of Cause">
              <select {...register('category_of_cause')} disabled={isReadOnly} className={inputCls}>
                <option value="">Select category (optional)</option>
                <option value="Man">Man</option>
                <option value="Machine">Machine</option>
                <option value="Method">Method</option>
                <option value="Material">Material</option>
                <option value="Measurement">Measurement</option>
                <option value="Environment">Environment</option>
              </select>
            </Field>
            <Field label="Solution Implemented" required error={errors.solution_implemented?.message}>
              <textarea {...register('solution_implemented')} disabled={isReadOnly} rows={4} placeholder="Describe the solution that was implemented" className={textareaCls} />
            </Field>
          </Section>

          {/* After State & Results */}
          <Section title="After State & Results">
            <Field label="Description of After State">
              <textarea {...register('after_description')} disabled={isReadOnly} rows={3} placeholder="Describe the situation after the improvement" className={textareaCls} />
            </Field>
            <Field label="Results Achieved">
              <textarea {...register('results')} disabled={isReadOnly} rows={3} placeholder="Quantify and describe the results" className={textareaCls} />
            </Field>
          </Section>

          {/* Evidence — Before / After photos and supporting documents */}
          <Section title="Evidence">
            {isReadOnly ? (
              <ReadOnlyAttachments attachments={kaizen.attachments} />
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-2">Before Images</p>
                  <FileUpload
                    key={`${kaizen.id}-before`}
                    entityType="kaizen"
                    initialFiles={kaizen.attachments
                      .filter((a) => a.attachment_type === 'BEFORE_PHOTO')
                      .map((a) => ({ fileId: a.file_id, fileName: a.file_name }))}
                    onFileUploaded={(fileId) => setBeforeFileIds((prev) => [...prev, fileId])}
                    onFileRemoved={(fileId) => setBeforeFileIds((prev) => prev.filter((id) => id !== fileId))}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-2">After Images</p>
                  <FileUpload
                    key={`${kaizen.id}-after`}
                    entityType="kaizen"
                    initialFiles={kaizen.attachments
                      .filter((a) => a.attachment_type === 'AFTER_PHOTO')
                      .map((a) => ({ fileId: a.file_id, fileName: a.file_name }))}
                    onFileUploaded={(fileId) => setAfterFileIds((prev) => [...prev, fileId])}
                    onFileRemoved={(fileId) => setAfterFileIds((prev) => prev.filter((id) => id !== fileId))}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-2">Supporting Documents</p>
                  <FileUpload
                    key={`${kaizen.id}-supporting`}
                    entityType="kaizen"
                    initialFiles={kaizen.attachments
                      .filter((a) => a.attachment_type === 'SUPPORTING_DOC')
                      .map((a) => ({ fileId: a.file_id, fileName: a.file_name }))}
                    onFileUploaded={(fileId) => setSupportingFileIds((prev) => [...prev, fileId])}
                    onFileRemoved={(fileId) => setSupportingFileIds((prev) => prev.filter((id) => id !== fileId))}
                  />
                </div>
              </div>
            )}
          </Section>

          {/* Cost & Benefit */}
          <Section title="Cost & Benefit Analysis">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Investment Cost (₹)">
                <input type="number" step="0.01" {...register('cost')} disabled={isReadOnly} placeholder="0.00" className={inputCls} />
              </Field>
              <Field label="Monetary Benefit (₹)">
                <input type="number" step="0.01" {...register('benefit')} disabled={isReadOnly} placeholder="0.00" className={inputCls} />
              </Field>
            </div>
            {ratio !== null && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <span className="text-xs text-slate-400">Cost/Benefit Ratio:</span>
                <span className="text-sm font-bold text-emerald-400">1 : {ratio}</span>
              </div>
            )}
          </Section>

          {/* Additional */}
          <Section title="Additional Information">
            <div className="flex items-center gap-3 py-1">
              <input
                type="checkbox"
                id="eem"
                {...register('early_equipment_mgmt')}
                disabled={isReadOnly}
                className="w-4 h-4 rounded accent-indigo-500"
              />
              <label htmlFor="eem" className="text-sm text-slate-300">Early Equipment Management applicable</label>
            </div>
            <Field label="Applicable Documents">
              <textarea {...register('applicable_documents')} disabled={isReadOnly} rows={2} placeholder="List any applicable standards or documents" className={textareaCls} />
            </Field>
            <Field label="Remarks">
              <textarea {...register('remarks')} disabled={isReadOnly} rows={2} placeholder="Any additional remarks" className={textareaCls} />
            </Field>
          </Section>

          {/* Actions */}
          {!isReadOnly && (
            <div className="flex gap-3 pb-8">
              <button
                type="button"
                onClick={() => void handleSubmit(onSave)()}
                disabled={saveMutation.isPending || submitMutation.isPending}
                className="px-6 py-2.5 glass hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving…' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit(onSubmit)()}
                disabled={saveMutation.isPending || submitMutation.isPending}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
              >
                {submitMutation.isPending ? 'Submitting…' : 'Submit for Review'}
              </button>
            </div>
          )}
        </form>
      </div>
    </PageTransition>
  )
}

// ─── Preview ──────────────────────────────────────────────────────────────────

function OnePagerPreview({
  kaizen,
  values,
  onClose,
}: {
  kaizen: NonNullable<ReturnType<typeof getKaizen> extends Promise<infer T> ? T : never>
  values: OnePagerFormValues
  onClose: () => void
}) {
  const ratio =
    values.cost && values.benefit && values.cost > 0
      ? Math.round((values.benefit / values.cost) * 100) / 100
      : null

  return (
    <PageTransition>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">One Pager Preview</h1>
          <button
            onClick={onClose}
            className="px-4 py-2 glass hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm font-medium rounded-xl transition-all"
          >
            ← Back to Form
          </button>
        </div>

        <div className="glass rounded-2xl p-8 space-y-6 border border-indigo-500/15">
          {/* Title block */}
          <div className="border-b border-white/10 pb-4">
            {kaizen.kaizen_id && (
              <p className="text-xs font-mono text-indigo-400 mb-1">{kaizen.kaizen_id}</p>
            )}
            <h2 className="text-2xl font-bold text-white">{values.title}</h2>
            <p className="text-sm text-slate-400 mt-1">
              {kaizen.zone.name}{kaizen.department && ` · ${kaizen.department.name}`}
              {kaizen.implementation_owner && ` · Owner: ${kaizen.implementation_owner.full_name}`}
            </p>
            {values.team_members && (
              <p className="text-sm text-slate-300 mt-1">Team: {values.team_members}</p>
            )}
          </div>

          <PreviewRow label="Problem Statement" value={kaizen.idea.problem_statement} />
          {values.business_impact && <PreviewRow label="Business Impact" value={values.business_impact} />}
          {values.before_description && <PreviewRow label="Before State" value={values.before_description} />}

          {/* 5W1H table */}
          {(values.w1h_who || values.w1h_what || values.w1h_where || values.w1h_when || values.w1h_why || values.w1h_how) && (
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">5W1H Analysis</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Who', values.w1h_who],
                  ['What', values.w1h_what],
                  ['Where', values.w1h_where],
                  ['When', values.w1h_when],
                  ['Why', values.w1h_why],
                  ['How', values.w1h_how],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="bg-white/5 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">{k}</p>
                    <p className="text-sm text-slate-200">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5 Why */}
          {[values.why_1, values.why_2, values.why_3, values.why_4, values.why_5].some(Boolean) && (
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">5 Why Analysis</p>
              <div className="space-y-2">
                {[values.why_1, values.why_2, values.why_3, values.why_4, values.why_5]
                  .map((v, i) => v ? <div key={i} className="flex gap-3 items-start">
                    <span className="text-xs font-bold text-indigo-400 flex-shrink-0 mt-0.5">Why {i + 1}</span>
                    <p className="text-sm text-slate-200">{v}</p>
                  </div> : null)
                  .filter(Boolean)}
              </div>
            </div>
          )}

          <PreviewRow label="Root Cause Analysis" value={values.root_cause_analysis} />
          {values.category_of_cause && <PreviewRow label="Category of Cause" value={values.category_of_cause} />}
          <PreviewRow label="Solution Implemented" value={values.solution_implemented} />
          {values.after_description && <PreviewRow label="After State" value={values.after_description} />}
          {values.results && <PreviewRow label="Results Achieved" value={values.results} />}

          {(values.cost || values.benefit) && (
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Cost & Benefit</p>
              <div className="grid grid-cols-3 gap-3">
                {values.cost != null && (
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Investment Cost</p>
                    <p className="text-lg font-bold text-white">₹{values.cost.toLocaleString()}</p>
                  </div>
                )}
                {values.benefit != null && (
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Monetary Benefit</p>
                    <p className="text-lg font-bold text-emerald-400">₹{values.benefit.toLocaleString()}</p>
                  </div>
                )}
                {ratio !== null && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Benefit / Cost</p>
                    <p className="text-lg font-bold text-emerald-400">1 : {ratio}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1.5 rounded-full ${values.early_equipment_mgmt ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' : 'bg-white/5 text-slate-500 border border-white/10'}`}>
              Early Equipment Management: {values.early_equipment_mgmt ? 'Yes' : 'No'}
            </span>
          </div>

          {values.applicable_documents && <PreviewRow label="Applicable Documents" value={values.applicable_documents} />}
          {values.remarks && <PreviewRow label="Remarks" value={values.remarks} />}
        </div>
      </div>
    </PageTransition>
  )
}

function ReadOnlyAttachments({ attachments }: { attachments: import('../../api/kaizens.js').KaizenAttachment[] }) {
  const groups: { type: string; label: string }[] = [
    { type: 'BEFORE_PHOTO', label: 'Before Images' },
    { type: 'AFTER_PHOTO', label: 'After Images' },
    { type: 'SUPPORTING_DOC', label: 'Supporting Documents' },
  ]
  return (
    <div className="space-y-4">
      {groups.map(({ type, label }) => {
        const items = attachments.filter((a) => a.attachment_type === type)
        return (
          <div key={type}>
            <p className="text-xs font-medium text-slate-400 mb-2">{label}</p>
            {items.length === 0 ? (
              <p className="text-xs text-slate-600 italic">No files attached</p>
            ) : (
              <ul className="space-y-1">
                {items.map((a) => (
                  <li key={a.file_id} className="flex items-center gap-3 bg-white/5 border border-white/8 px-3 py-2 rounded-xl text-sm">
                    <span className="text-slate-300 truncate">{a.file_name}</span>
                    <span className="text-slate-600 text-xs flex-shrink-0">{a.content_type}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">{label}</p>
      <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  )
}
