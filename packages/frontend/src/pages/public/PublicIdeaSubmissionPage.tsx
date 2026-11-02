import { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  lookupEmployee,
  getPublicMasterData,
  submitPublicIdea,
  type PublicEmployeeProfile,
  type PublicSubmitResult,
} from '../../api/public.js'

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ result, onReset }: { result: PublicSubmitResult; onReset: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5 border-4 border-emerald-300">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Idea Submitted!</h2>
        <p className="text-gray-500 text-sm mb-6">Your idea has been received and entered into the review workflow.</p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-xs text-gray-500 font-medium">Registration ID</span>
            <span className="font-mono text-sm text-indigo-600 font-bold">{result.registration_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-500 font-medium">Current Stage</span>
            <span className="text-sm text-gray-800 font-medium">{result.current_stage}</span>
          </div>
          {result.assigned_to && (
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 font-medium">Assigned To</span>
              <span className="text-sm text-gray-800">{result.assigned_to.full_name}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-6">Save your Registration ID to follow up on your idea.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onReset}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            Submit Another Idea
          </button>
          <button onClick={() => navigate('/login')}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
            Staff Login
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Field label ──────────────────────────────────────────────────────────────

function Label({ icon, text, required }: { icon: React.ReactNode; text: string; required?: boolean }) {
  return (
    <label className="flex items-center gap-1.5 text-sm text-gray-600 font-medium mb-1.5">
      <span className="text-gray-400">{icon}</span>
      {text}{required && <span className="text-red-500">*</span>}
    </label>
  )
}

const inputCls  = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors bg-white'
const selectCls = `${inputCls} appearance-none cursor-pointer`
const readonlyCls = `${inputCls} bg-gray-100 text-gray-500 cursor-not-allowed`

// ─── Icons ────────────────────────────────────────────────────────────────────

const PersonIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const LayersIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
const MapPinIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
const BuildingIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M8 21V11h8v10"/></svg>

// ─── Main page ────────────────────────────────────────────────────────────────

export function PublicIdeaSubmissionPage() {
  const navigate = useNavigate()

  const [submitted, setSubmitted] = useState<PublicSubmitResult | null>(null)

  // Employee ID lookup
  const [empId,       setEmpId]       = useState('')
  const [profile,     setProfile]     = useState<PublicEmployeeProfile | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [looking,     setLooking]     = useState(false)
  const empIdRef = useRef<HTMLInputElement>(null)

  // Idea owner location (from profile, editable)
  const [ownerZoneId, setOwnerZoneId] = useState('')
  const [ownerHallId, setOwnerHallId] = useState('')

  // Operational details
  const [functionId,  setFunctionId]  = useState('')
  const [zoneId,      setZoneId]      = useState('')
  const [locationId,  setLocationId]  = useState('')
  const [valueStream, setValueStream] = useState('')
  const [hallId,      setHallId]      = useState('')
  const [categoryId,  setCategoryId]  = useState('')
  const [subCatId,    setSubCatId]    = useState('')
  const [deptId,      setDeptId]      = useState('')
  const [plantId,     setPlantId]     = useState('')

  // Idea content
  const [problemStatement, setProblemStatement] = useState('')
  const [description,      setDescription]      = useState('')
  const [remarks,          setRemarks]          = useState('')
  const [isAnonymous,      setIsAnonymous]      = useState(false)

  const { data: master } = useQuery({
    queryKey: ['public-master-data'],
    queryFn: getPublicMasterData,
    staleTime: 5 * 60_000,
  })

  // Cascading selects
  const ownerZones  = useMemo(() => master?.zones.filter((z) => z.plant_id === plantId) ?? [],         [master, plantId])
  const ownerHalls  = useMemo(() => master?.halls.filter((h) => h.function_id === functionId) ?? [],   [master, functionId])
  const opZones     = useMemo(() => master?.zones.filter((z) => z.plant_id === plantId) ?? [],         [master, plantId])
  const opFuncs     = useMemo(() => master?.functions.filter((f) => f.department_id === deptId) ?? [], [master, deptId])
  const opHalls     = useMemo(() => master?.halls.filter((h) => h.function_id === functionId) ?? [],   [master, functionId])
  const subCats     = useMemo(() => master?.sub_categories.filter((s) => s.category_id === categoryId) ?? [], [master, categoryId])

  async function handleLookup() {
    const id = empId.trim()
    if (!id) { setLookupError('Enter your Employee ID'); return }
    setLookupError('')
    setLooking(true)
    try {
      const p = await lookupEmployee(id)
      setProfile(p)
      // Pre-fill from profile
      if (p.home_plant)       { setPlantId(p.home_plant.id) }
      if (p.home_zone)        { setOwnerZoneId(p.home_zone.id); setZoneId(p.home_zone.id) }
      if (p.home_department)  { setDeptId(p.home_department.id) }
      if (p.home_function)    { setFunctionId(p.home_function.id) }
      if (p.home_hall)        { setOwnerHallId(p.home_hall.id); setHallId(p.home_hall.id) }
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Employee ID not found')
      setProfile(null)
    } finally {
      setLooking(false)
    }
  }

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!profile) throw new Error('Profile not loaded')
      if (!plantId || !zoneId || !deptId || !categoryId) throw new Error('Fill all required fields')
      if (!problemStatement.trim() || !description.trim()) throw new Error('Fill problem statement and description')
      return submitPublicIdea({
        employee_id:      profile.employee_id,
        plant_id:         plantId,
        zone_id:          zoneId,
        department_id:    deptId,
        function_id:      functionId || undefined,
        hall_id:          hallId || undefined,
        location_id:      locationId || undefined,
        value_stream:     valueStream || undefined,
        category_id:      categoryId,
        sub_category_id:  subCatId || undefined,
        problem_statement: problemStatement.trim(),
        description:      description.trim(),
        remarks:          remarks.trim() || undefined,
        is_anonymous:     isAnonymous,
      })
    },
    onSuccess: (result) => setSubmitted(result),
  })

  function handleReset() {
    setSubmitted(null); setEmpId(''); setProfile(null); setLookupError('')
    setPlantId(''); setOwnerZoneId(''); setOwnerHallId('')
    setFunctionId(''); setZoneId(''); setLocationId(''); setValueStream(''); setHallId('')
    setCategoryId(''); setSubCatId(''); setDeptId('')
    setProblemStatement(''); setDescription(''); setRemarks(''); setIsAnonymous(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <SuccessScreen result={submitted} onReset={handleReset} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onLogin={() => navigate('/login')} />

      <div className="flex-1 p-4 max-w-6xl mx-auto w-full">

        {/* Red banner */}
        <div className="bg-red-600 text-white px-5 py-3 rounded-t-xl flex items-center gap-2 font-semibold text-sm">
          <span>💡</span>
          <span>Submitting Improvement Idea for</span>
          {profile && <span className="font-bold ml-1">— {isAnonymous ? 'Anonymous' : profile.full_name}</span>}
        </div>

        <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-sm">

          {/* ── Idea Owner Details ── */}
          <div className="border-b border-gray-200">
            <div className="bg-red-50 px-5 py-2.5 border-b border-red-100">
              <p className="text-sm font-semibold text-red-700">Idea owner details</p>
            </div>
            <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Employee ID */}
              <div>
                <Label icon={<PersonIcon />} text="Employee ID" required />
                <div className="relative">
                  <input
                    ref={empIdRef}
                    type="text"
                    value={empId}
                    onChange={(e) => { setEmpId(e.target.value); setLookupError('') }}
                    onBlur={() => { if (empId.trim() && !profile) void handleLookup() }}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleLookup() }}
                    placeholder="e.g. EMP002"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => void handleLookup()}
                    disabled={looking}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors"
                    title="Look up employee"
                  >
                    {looking
                      ? <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin block" />
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    }
                  </button>
                </div>
                {lookupError && <p className="mt-1 text-xs text-red-500">{lookupError}</p>}
              </div>

              {/* Employee Name — auto-filled */}
              <div>
                <Label icon={<PersonIcon />} text="Employee Name" required />
                <input type="text" value={profile?.full_name ?? ''} readOnly placeholder="Auto-filled from Employee ID" className={readonlyCls} />
              </div>

              {/* Zone of Idea Owner */}
              <div>
                <Label icon={<LayersIcon />} text="Zone of Idea Owner" required />
                <select value={ownerZoneId} onChange={(e) => setOwnerZoneId(e.target.value)} className={selectCls}>
                  <option value="">Select zone…</option>
                  {ownerZones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>

              {/* Hall of Idea Owner */}
              <div>
                <Label icon={<BuildingIcon />} text="Hall of Idea Owner" required />
                <select value={ownerHallId} onChange={(e) => setOwnerHallId(e.target.value)} className={selectCls}>
                  <option value="">Select hall…</option>
                  {ownerHalls.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>

            </div>
          </div>

          {/* ── Operational Details ── */}
          <div>
            <div className="bg-red-50 px-5 py-2.5 border-b border-red-100">
              <p className="text-sm font-semibold text-red-700">Operational Details</p>
            </div>
            <div className="px-5 py-5 space-y-4">

              {/* Row 1: Function / Zone / Location / Value Stream */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label icon={<BuildingIcon />} text="Function" required />
                  <select value={functionId} onChange={(e) => setFunctionId(e.target.value)} className={selectCls}>
                    <option value=""></option>
                    {opFuncs.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label icon={<MapPinIcon />} text="Zone" required />
                  <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={selectCls}>
                    <option value=""></option>
                    {opZones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label icon={<MapPinIcon />} text="Location" required />
                  <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className={selectCls}>
                    <option value=""></option>
                    {master?.zones.filter((z) => z.id === zoneId).map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label icon={<LayersIcon />} text="Value Stream" required />
                  <input type="text" value={valueStream} onChange={(e) => setValueStream(e.target.value)}
                    placeholder="e.g. Assembly Line 3" className={inputCls} />
                </div>
              </div>

              {/* Row 2: Hall / Category / Sub-category / Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label icon={<BuildingIcon />} text="Hall" required />
                  <select value={hallId} onChange={(e) => setHallId(e.target.value)} className={selectCls}>
                    <option value=""></option>
                    {opHalls.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label icon={<LayersIcon />} text="Category" required />
                  <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubCatId('') }} className={selectCls}>
                    <option value=""></option>
                    {master?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label icon={<LayersIcon />} text="Sub-category" />
                  <select value={subCatId} onChange={(e) => setSubCatId(e.target.value)} disabled={!categoryId} className={selectCls}>
                    <option value=""></option>
                    {subCats.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label icon={<BuildingIcon />} text="Department" required />
                  <select value={deptId} onChange={(e) => setDeptId(e.target.value)} className={selectCls}>
                    <option value=""></option>
                    {master?.departments.filter((d) => d.zone_id === zoneId).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3: Problem statement + Idea Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label icon={<PersonIcon />} text="Problem statement" required />
                  <textarea
                    value={problemStatement}
                    onChange={(e) => setProblemStatement(e.target.value)}
                    rows={4}
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <div>
                  <Label icon={<PersonIcon />} text="Idea Description" required />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className={`${inputCls} resize-none`}
                  />
                </div>
              </div>

              {/* Upload Document */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Upload Document</p>
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Browse File
                  <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" />
                </label>
                <p className="mt-2 text-xs text-gray-400">No items found</p>
              </div>

              {/* Remarks */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Remarks</p>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Anonymous toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-sm text-gray-600">Submit anonymously <span className="text-gray-400 text-xs">(your name will be hidden from reviewers)</span></span>
              </label>

              {submitMutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {(submitMutation.error as Error).message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-0 bg-white border border-t-0 border-gray-200 rounded-b-xl px-5 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-5 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || !profile}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            {submitMutation.isPending ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ onLogin }: { onLogin?: () => void }) {
  const navigate = useNavigate()
  return (
    <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800 leading-tight">Kaizen Digitalization Platform</p>
          <p className="text-[10px] text-gray-400">Continuous Improvement</p>
        </div>
      </div>
      <button
        onClick={onLogin ?? (() => navigate('/login'))}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        Staff Login
      </button>
    </header>
  )
}
