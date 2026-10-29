import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../hooks/useToast.js'
import { createIdea } from '../../api/ideas.js'
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

const schema = z.object({
  title:              z.string().min(1, 'Required').max(500),
  description:        z.string().min(1, 'Required'),
  problem_statement:  z.string().min(1, 'Required'),
  proposed_solution:  z.string().min(1, 'Required'),
  expected_benefits:  z.string().optional(),
  is_anonymous:       z.boolean().default(false),
  plant_id:           z.string().min(1),
  zone_id:            z.string().min(1, 'Select a zone'),
  department_id:      z.string().min(1, 'Select a department'),
  function_id:        z.string().optional(),
  hall_id:            z.string().optional(),
  location_id:        z.string().optional(),
  category_id:        z.string().min(1, 'Select a category'),
  sub_category_id:    z.string().optional(),
  tag_ids:            z.array(z.string()).default([]),
  attachment_file_ids: z.array(z.string()).default([]),
})

type FormValues = z.infer<typeof schema>

const STEP_LABELS = ['Idea Details', 'Location & Category', 'Attachments & Review']

// ─── Step indicator ───────────────────────────────────────────────────────────

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

// ─── Input helpers ────────────────────────────────────────────────────────────

const inputCls = 'block w-full rounded-xl bg-white/5 border border-white/10 text-slate-200 placeholder-slate-600 px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all duration-200'
const selectCls = `${inputCls} appearance-none`

function Field({ label, error, children, hint }: { label: string; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-600">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function IdeaSubmitPage() {
  const { user } = useAuth()
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
      is_anonymous: false,
    },
  })

  const selectedZone = watch('zone_id')
  const selectedDept = watch('department_id')
  const selectedFunc = watch('function_id')
  const selectedHall = watch('hall_id')
  const selectedCat  = watch('category_id')

  useEffect(() => { setValue('department_id', ''); setValue('function_id', ''); setValue('hall_id', ''); setValue('location_id', '') }, [selectedZone, setValue])
  useEffect(() => { setValue('function_id', ''); setValue('hall_id', ''); setValue('location_id', '') }, [selectedDept, setValue])
  useEffect(() => { setValue('hall_id', ''); setValue('location_id', '') }, [selectedFunc, setValue])
  useEffect(() => { setValue('location_id', '') }, [selectedHall, setValue])
  useEffect(() => { setValue('sub_category_id', '') }, [selectedCat, setValue])

  const plantId = user?.plant_id ?? ''
  const { data: zones      = [] } = useQuery({ queryKey: ['zones', plantId],     queryFn: () => getZonesByPlant(plantId),            enabled: !!plantId })
  const { data: depts      = [] } = useQuery({ queryKey: ['depts', selectedZone],   queryFn: () => getDeptsByZone(selectedZone),         enabled: !!selectedZone })
  const { data: funcs      = [] } = useQuery({ queryKey: ['funcs', selectedDept],   queryFn: () => getFunctionsByDept(selectedDept),     enabled: !!selectedDept })
  const { data: halls      = [] } = useQuery({ queryKey: ['halls', selectedFunc],   queryFn: () => getHallsByFunction(selectedFunc ?? ''), enabled: !!selectedFunc })
  const { data: locations  = [] } = useQuery({ queryKey: ['locations', selectedHall], queryFn: () => getLocationsByHall(selectedHall ?? ''), enabled: !!selectedHall })
  const { data: categories = [] } = useQuery({ queryKey: ['categories'],          queryFn: getCategories })
  const { data: subCats    = [] } = useQuery({ queryKey: ['subCats', selectedCat],  queryFn: () => getSubCategoriesByCategory(selectedCat), enabled: !!selectedCat })
  const { data: tags       = [] } = useQuery({ queryKey: ['tags'],               queryFn: getTags })

  const STEP1_FIELDS: (keyof FormValues)[] = ['title', 'description', 'problem_statement', 'proposed_solution']
  const STEP2_FIELDS: (keyof FormValues)[] = ['zone_id', 'department_id', 'category_id']

  const goNext = async () => {
    const fieldsToValidate = step === 0 ? STEP1_FIELDS : STEP2_FIELDS
    const valid = await trigger(fieldsToValidate)
    if (valid) setStep((s) => s + 1)
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
          <p className="text-sm text-slate-400 mt-1">Share your kaizen improvement idea with your team</p>
        </div>

        <StepIndicator current={step} total={3} />

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>

          {/* ── Step 1: Idea Details ── */}
          {step === 0 && (
            <div className="glass rounded-2xl p-6 space-y-5" style={{ animation: 'pageFadeIn 0.2s ease-out' }}>
              <div className="mb-1">
                <p className="text-base font-semibold text-white">Idea Details</p>
                <p className="text-xs text-slate-500 mt-0.5">Describe the problem you've identified and your proposed improvement</p>
              </div>

              <Field label="Title *" error={errors.title?.message}>
                <input {...register('title')} className={inputCls} placeholder="Brief, clear title for your idea" />
              </Field>

              <Field label="Description *" error={errors.description?.message} hint="Give a clear overview of your idea">
                <textarea {...register('description')} rows={3} className={inputCls} placeholder="What is the overall idea?" />
              </Field>

              <Field label="Problem Statement *" error={errors.problem_statement?.message} hint="What issue or waste have you observed?">
                <textarea {...register('problem_statement')} rows={3} className={inputCls} placeholder="Describe the current problem or inefficiency…" />
              </Field>

              <Field label="Proposed Solution *" error={errors.proposed_solution?.message} hint="How do you propose to address it?">
                <textarea {...register('proposed_solution')} rows={3} className={inputCls} placeholder="What changes would you like to see?" />
              </Field>

              <Field label="Expected Benefits" error={undefined} hint="Optional — what improvements do you expect?">
                <textarea {...register('expected_benefits')} rows={2} className={inputCls} placeholder="Cost savings, safety improvements, efficiency gains…" />
              </Field>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" {...register('is_anonymous')} id="anon" className="sr-only peer" />
                  <div className="w-10 h-5 rounded-full bg-white/10 border border-white/10 peer-checked:bg-indigo-600 peer-checked:border-indigo-500 transition-all duration-200" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-300 font-medium">Submit anonymously</p>
                  <p className="text-xs text-slate-500">Your name won't be shown on this idea</p>
                </div>
              </label>
            </div>
          )}

          {/* ── Step 2: Location & Category ── */}
          {step === 1 && (
            <div className="glass rounded-2xl p-6 space-y-5" style={{ animation: 'pageFadeIn 0.2s ease-out' }}>
              <div className="mb-1">
                <p className="text-base font-semibold text-white">Location & Classification</p>
                <p className="text-xs text-slate-500 mt-0.5">Help us route your idea to the right reviewers</p>
              </div>

              <Field label="Plant" error={undefined}>
                <input value={plantId} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
                <input type="hidden" {...register('plant_id')} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Zone *" error={errors.zone_id?.message}>
                  <select {...register('zone_id')} className={selectCls}>
                    <option value="">Select zone…</option>
                    {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </Field>

                <Field label="Department *" error={errors.department_id?.message}>
                  <select {...register('department_id')} className={selectCls} disabled={!selectedZone}>
                    <option value="">Select department…</option>
                    {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Function" error={undefined}>
                  <select {...register('function_id')} className={selectCls} disabled={!selectedDept}>
                    <option value="">Optional</option>
                    {funcs.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </Field>

                <Field label="Hall" error={undefined}>
                  <select {...register('hall_id')} className={selectCls} disabled={!selectedFunc}>
                    <option value="">Optional</option>
                    {halls.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Location" error={undefined}>
                <select {...register('location_id')} className={selectCls} disabled={!selectedHall}>
                  <option value="">Optional</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </Field>

              <div className="border-t border-white/5 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Category *" error={errors.category_id?.message}>
                    <select {...register('category_id')} className={selectCls}>
                      <option value="">Select category…</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>

                  <Field label="Sub-Category" error={undefined}>
                    <select {...register('sub_category_id')} className={selectCls} disabled={!selectedCat}>
                      <option value="">Optional</option>
                      {subCats.map((sc) => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              {tags.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tags</label>
                  <Controller
                    control={control}
                    name="tag_ids"
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
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
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Attachments & Review ── */}
          {step === 2 && (
            <div className="space-y-4" style={{ animation: 'pageFadeIn 0.2s ease-out' }}>
              {/* Attachments */}
              <div className="glass rounded-2xl p-6">
                <p className="text-base font-semibold text-white mb-1">Attachments</p>
                <p className="text-xs text-slate-500 mb-5">Upload photos, sketches, or documents that support your idea</p>
                <FileUpload
                  entityType="idea"
                  onFileUploaded={handleFileUploaded}
                  onFileRemoved={handleFileRemoved}
                />
              </div>

              {/* Review summary */}
              <div className="glass rounded-2xl p-6">
                <p className="text-base font-semibold text-white mb-4">Review Summary</p>
                <div className="space-y-3">
                  <ReviewRow label="Title"            value={watchedVals.title} />
                  <ReviewRow label="Zone"             value={zones.find((z) => z.id === watchedVals.zone_id)?.name} />
                  <ReviewRow label="Department"       value={depts.find((d) => d.id === watchedVals.department_id)?.name} />
                  <ReviewRow label="Category"         value={categories.find((c) => c.id === watchedVals.category_id)?.name} />
                  <ReviewRow label="Anonymous"        value={watchedVals.is_anonymous ? 'Yes' : 'No'} />
                  <ReviewRow label="Attachments"      value={`${(watchedVals.attachment_file_ids ?? []).length} file(s)`} />
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
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
