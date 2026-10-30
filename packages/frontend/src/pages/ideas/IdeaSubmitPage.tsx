import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../hooks/useToast.js'
import { createIdea } from '../../api/ideas.js'
import { getMyProfile } from '../../api/auth.js'
import { FileUpload } from '../../components/FileUpload.js'
import { PageTransition } from '../../components/PageTransition.js'
import {
  getZonesByPlant,
  getDeptsByZone,
  getFunctionsByDept,
  getHallsByFunction,
  getLocationsByHall,
  getCategories,
  getSubCategoriesByCategory,
  getTags,
} from '../../api/master.js'
import { useState } from 'react'

// Treat empty string from <select> as undefined (avoids sending "" as a UUID)
const optUuid = z.preprocess((v) => (v === '' ? undefined : v), z.string().optional())

const schema = z.object({
  // Operational location (drives workflow routing)
  plant_id:           z.string().min(1),
  zone_id:            z.string().min(1, 'Select an idea zone'),
  department_id:      z.string().min(1, 'Select an idea department'),
  function_id:        optUuid,
  hall_id:            optUuid,
  location_id:        optUuid,
  value_stream:       z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  // Classification
  category_id:        z.string().min(1, 'Select a category'),
  sub_category_id:    optUuid,
  tag_ids:            z.array(z.string()).default([]),
  // Idea content
  problem_statement:  z.string().min(1, 'Required'),
  description:        z.string().min(1, 'Required'),
  remarks:            z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  // Attachments
  attachment_file_ids: z.array(z.string()).default([]),
})

type FormValues = z.infer<typeof schema>

const STEP_LABELS = ['Employee Info', 'Operational Details', 'Idea Details']

// ─── Step indicator (unchanged) ───────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  done   ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' :
                  active ? 'bg-indigo-600/30 border-2 border-indigo-500 text-indigo-300' :
                           'bg-white/5 border border-white/10 text-slate-500'
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${active ? 'text-indigo-300' : done ? 'text-slate-400' : 'text-slate-600'}`}>
                {STEP_LABELS[i]}
              </span>
            </div>
            {i < total - 1 && (
              <div className={`flex-1 h-px mx-2 mb-5 transition-all duration-300 ${done ? 'bg-indigo-600' : 'bg-white/10'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Input helpers (unchanged) ────────────────────────────────────────────────

const inputCls = 'block w-full rounded-xl bg-white/5 border border-white/10 text-slate-200 placeholder-slate-600 px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all duration-200'
const selectCls = `${inputCls} appearance-none`
const readonlyCls = 'block w-full rounded-xl bg-white/3 border border-white/5 text-slate-400 px-4 py-2.5 text-sm cursor-not-allowed select-none'

function Field({ label, error, children, hint, required }: {
  label: string; error?: string; children: React.ReactNode; hint?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {label}{required && <span className="text-indigo-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-600">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Employee info row (read-only) ─────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 flex-shrink-0">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className={readonlyCls + ' flex-1'}>{value || <span className="text-slate-600">—</span>}</div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function IdeaSubmitPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [step, setStep] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      plant_id: user?.plant_id ?? '',
      tag_ids: [],
      attachment_file_ids: [],
    },
  })

  const selectedZone = watch('zone_id')
  const selectedDept = watch('department_id')
  const selectedFunc = watch('function_id')
  const selectedHall = watch('hall_id')
  const selectedCat  = watch('category_id')

  useEffect(() => {
    setValue('department_id', '')
    setValue('function_id', '')
    setValue('hall_id', '')
    setValue('location_id', '')
  }, [selectedZone, setValue])
  useEffect(() => { setValue('function_id', ''); setValue('hall_id', ''); setValue('location_id', '') }, [selectedDept, setValue])
  useEffect(() => { setValue('hall_id', ''); setValue('location_id', '') }, [selectedFunc, setValue])
  useEffect(() => { setValue('location_id', '') }, [selectedHall, setValue])
  useEffect(() => { setValue('sub_category_id', '') }, [selectedCat, setValue])

  const plantId = user?.plant_id ?? ''

  // Profile for Employee Info section
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: () => getMyProfile(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })

  // Cascading org data
  const { data: zones      = [] } = useQuery({ queryKey: ['zones', plantId],       queryFn: () => getZonesByPlant(plantId),                enabled: !!plantId })
  const { data: depts      = [] } = useQuery({ queryKey: ['depts', selectedZone],  queryFn: () => getDeptsByZone(selectedZone),             enabled: !!selectedZone })
  const { data: funcs      = [] } = useQuery({ queryKey: ['funcs', selectedDept],  queryFn: () => getFunctionsByDept(selectedDept),         enabled: !!selectedDept })
  const { data: halls      = [] } = useQuery({ queryKey: ['halls', selectedFunc],  queryFn: () => getHallsByFunction(selectedFunc ?? ''),   enabled: !!selectedFunc })
  const { data: locations  = [] } = useQuery({ queryKey: ['locs',  selectedHall],  queryFn: () => getLocationsByHall(selectedHall ?? ''),   enabled: !!selectedHall })
  const { data: categories = [] } = useQuery({ queryKey: ['categories'],            queryFn: getCategories })
  const { data: subCats    = [] } = useQuery({ queryKey: ['subCats', selectedCat], queryFn: () => getSubCategoriesByCategory(selectedCat),  enabled: !!selectedCat })
  const { data: tags       = [] } = useQuery({ queryKey: ['tags'],                  queryFn: getTags })

  const STEP2_FIELDS: (keyof FormValues)[] = ['zone_id', 'department_id', 'category_id']
  const STEP3_FIELDS: (keyof FormValues)[] = ['problem_statement', 'description']

  const goNext = async () => {
    if (step === 1) {
      const valid = await trigger(STEP2_FIELDS)
      if (!valid) return
    }
    if (step === 2) {
      const valid = await trigger(STEP3_FIELDS)
      if (!valid) return
    }
    setStep((s) => s + 1)
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await createIdea(values)
      addToast('Idea submitted successfully!', 'success')
      navigate(`/ideas/${res.data.id}`)
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Submission failed', 'error')
    }
  }

  const handleFileUploaded = (fileId: string) => {
    const current = watch('attachment_file_ids') ?? []
    setValue('attachment_file_ids', [...current, fileId])
  }

  const handleFileRemoved = (fileId: string) => {
    const current = watch('attachment_file_ids') ?? []
    setValue('attachment_file_ids', current.filter((id) => id !== fileId))
  }

  const watchedVals = watch()

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Submit Idea</h1>
          <p className="text-sm text-slate-400 mt-1">Log a kaizen improvement idea through the KIET workflow</p>
        </div>

        <StepIndicator current={step} total={3} />

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>

          {/* ══════════════════════════════════════════════════════
              STEP 1 — Employee Information (read-only)
          ══════════════════════════════════════════════════════ */}
          {step === 0 && (
            <div className="glass rounded-2xl p-6 space-y-4" style={{ animation: 'pageFadeIn 0.2s ease-out' }}>
              <div className="mb-2">
                <p className="text-base font-semibold text-white">Employee Information</p>
                <p className="text-xs text-slate-500 mt-0.5">Your profile details are auto-filled and read-only</p>
              </div>

              {profileLoading ? (
                <div className="space-y-3">
                  {[1,2,3,4,5,6,7].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-32 h-4 rounded shimmer flex-shrink-0" />
                      <div className="flex-1 h-9 rounded-xl shimmer" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <InfoRow label="Employee ID"     value={profile?.employee_id} />
                  <InfoRow label="Employee Name"   value={profile?.full_name} />
                  <InfoRow label="Home Plant"      value={profile?.home_plant?.name} />
                  <InfoRow label="Home Department" value={profile?.home_department?.name} />
                  <InfoRow label="Home Function"   value={profile?.home_function?.name} />
                  <InfoRow label="Home Zone"       value={profile?.home_zone?.name} />
                  <InfoRow label="Home Hall"       value={profile?.home_hall?.name} />
                </div>
              )}

              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-slate-600 italic">
                  Not your details? Contact your system administrator to update your profile.
                </p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 2 — Operational Details
          ══════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="glass rounded-2xl p-6 space-y-5" style={{ animation: 'pageFadeIn 0.2s ease-out' }}>
              <div className="mb-1">
                <p className="text-base font-semibold text-white">Operational Details</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select where this idea applies. The Idea Zone and Department determine workflow reviewers.
                </p>
              </div>

              {/* Hidden plant_id */}
              <input type="hidden" {...register('plant_id')} />

              <div className="grid grid-cols-2 gap-4">
                <Field label="Idea Zone" required error={errors.zone_id?.message}>
                  <select {...register('zone_id')} className={selectCls}>
                    <option value="">Select zone…</option>
                    {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </Field>

                <Field label="Idea Department" required error={errors.department_id?.message}>
                  <select {...register('department_id')} className={selectCls} disabled={!selectedZone}>
                    <option value="">Select department…</option>
                    {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Idea Function">
                  <select {...register('function_id')} className={selectCls} disabled={!selectedDept}>
                    <option value="">Optional</option>
                    {funcs.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </Field>

                <Field label="Idea Hall">
                  <select {...register('hall_id')} className={selectCls} disabled={!selectedFunc}>
                    <option value="">Optional</option>
                    {halls.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Idea Location">
                  <select {...register('location_id')} className={selectCls} disabled={!selectedHall}>
                    <option value="">Optional</option>
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </Field>

                <Field label="Value Stream" hint="e.g. Assembly Line 3, Packaging">
                  <input {...register('value_stream')} className={inputCls} placeholder="Optional" />
                </Field>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Category" required error={errors.category_id?.message}>
                    <select {...register('category_id')} className={selectCls}>
                      <option value="">Select category…</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>

                  <Field label="Sub-Category">
                    <select {...register('sub_category_id')} className={selectCls} disabled={!selectedCat}>
                      <option value="">Optional</option>
                      {subCats.map((sc) => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                    </select>
                  </Field>
                </div>

                {tags.length > 0 && (
                  <Field label="Tags">
                    <Controller
                      control={control}
                      name="tag_ids"
                      render={({ field }) => (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {tags.map((tag) => {
                            const checked = field.value.includes(tag.id)
                            return (
                              <label
                                key={tag.id}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border transition-all duration-200 ${
                                  checked
                                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                                    : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300 hover:bg-white/10'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={checked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      field.onChange([...field.value, tag.id])
                                    } else {
                                      field.onChange(field.value.filter((id) => id !== tag.id))
                                    }
                                  }}
                                />
                                {tag.name}
                              </label>
                            )
                          })}
                        </div>
                      )}
                    />
                  </Field>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              STEP 3 — Idea Details + Upload + Review
          ══════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-4" style={{ animation: 'pageFadeIn 0.2s ease-out' }}>

              {/* Idea content fields */}
              <div className="glass rounded-2xl p-6 space-y-5">
                <div className="mb-1">
                  <p className="text-base font-semibold text-white">Idea Details</p>
                  <p className="text-xs text-slate-500 mt-0.5">Describe the problem and your proposed improvement</p>
                </div>

                <Field label="Problem Statement" required error={errors.problem_statement?.message}
                  hint="What issue, waste, or safety risk have you observed?">
                  <textarea
                    {...register('problem_statement')}
                    rows={3}
                    className={inputCls}
                    placeholder="Describe the current problem or inefficiency…"
                  />
                </Field>

                <Field label="Idea Description" required error={errors.description?.message}
                  hint="What is your proposed improvement or solution?">
                  <textarea
                    {...register('description')}
                    rows={3}
                    className={inputCls}
                    placeholder="Describe your idea and how it addresses the problem…"
                  />
                </Field>

                <Field label="Remarks" hint="Optional — any additional notes, context, or expected benefits">
                  <textarea
                    {...register('remarks')}
                    rows={2}
                    className={inputCls}
                    placeholder="Additional context, cost savings, safety improvements…"
                  />
                </Field>
              </div>

              {/* Document upload */}
              <div className="glass rounded-2xl p-6">
                <p className="text-base font-semibold text-white mb-1">Upload Document</p>
                <p className="text-xs text-slate-500 mb-5">
                  Attach photos, sketches, or supporting documents (PDF, images, Office files — max 10 MB each)
                </p>
                <FileUpload
                  entityType="idea"
                  onFileUploaded={handleFileUploaded}
                  onFileRemoved={handleFileRemoved}
                />
              </div>

              {/* Review summary */}
              <div className="glass rounded-2xl p-6">
                <p className="text-base font-semibold text-white mb-4">Review Summary</p>
                <div className="space-y-0">
                  <ReviewRow label="Idea Zone"     value={zones.find((z) => z.id === watchedVals.zone_id)?.name} />
                  <ReviewRow label="Department"    value={depts.find((d) => d.id === watchedVals.department_id)?.name} />
                  <ReviewRow label="Category"      value={categories.find((c) => c.id === watchedVals.category_id)?.name} />
                  {watchedVals.value_stream && <ReviewRow label="Value Stream" value={watchedVals.value_stream} />}
                  <ReviewRow label="Problem"       value={watchedVals.problem_statement?.slice(0, 80) + (watchedVals.problem_statement?.length > 80 ? '…' : '')} />
                  <ReviewRow label="Attachments"   value={`${(watchedVals.attachment_file_ids ?? []).length} file(s)`} />
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation (unchanged) ── */}
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={() => step === 0 ? navigate('/ideas') : setStep((s) => s - 1)}
              className="px-5 py-2.5 glass rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              {step === 0 ? 'Cancel' : '← Back'}
            </button>

            {step < 2 ? (
              <button
                type="button"
                onClick={() => void goNext()}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-lg shadow-indigo-500/25"
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting…' : 'Submit Idea ✓'}
              </button>
            )}
          </div>
        </form>
      </div>
    </PageTransition>
  )
}

function ReviewRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs text-slate-200 font-medium text-right max-w-[60%] truncate">{value || '—'}</span>
    </div>
  )
}
