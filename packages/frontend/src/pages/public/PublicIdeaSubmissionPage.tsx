import { useState, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  lookupEmployee,
  getPublicMasterData,
  submitPublicIdea,
  uploadPublicFile,
  type PublicEmployeeProfile,
  type PublicSubmitResult,
} from '../../api/public.js'

// ─── Header ───────────────────────────────────────────────────────────────────

function PageHeader() {
  const navigate = useNavigate()
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-sm">K</div>
        <div>
          <div className="font-semibold text-gray-900 text-sm leading-tight">Kaizen Digitalization Platform</div>
          <div className="text-xs text-gray-500">ACG — Submit Your Idea</div>
        </div>
      </div>
      <button
        onClick={() => navigate('/login')}
        className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded-lg transition-colors"
      >
        Staff Login
      </button>
    </header>
  )
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
      {text}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Select({
  value, onChange, disabled, children, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  children: React.ReactNode
  placeholder?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:text-gray-400"
    >
      <option value="">{placeholder ?? '— Select —'}</option>
      {children}
    </select>
  )
}

function TextArea({
  value, onChange, placeholder, rows = 4, required,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  required?: boolean
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
    />
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="bg-red-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-t-lg">
      {title}
    </div>
  )
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ result, onNew }: { result: PublicSubmitResult; onNew: () => void }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(result.registration_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-md p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Idea Submitted!</h2>
          <p className="text-sm text-gray-500 mb-6">Your idea has been recorded and is now under review.</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-1">Registration ID</div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-mono font-bold text-gray-900">{result.registration_id}</span>
              <button
                onClick={() => void copy()}
                title="Copy"
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6 text-left">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-0.5">Current Stage</div>
              <div className="text-sm font-semibold text-gray-800">{result.current_stage}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-0.5">Status</div>
              <div className="text-sm font-semibold text-gray-800">{result.status}</div>
            </div>
            {result.assigned_to && (
              <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-0.5">Assigned To</div>
                <div className="text-sm font-semibold text-gray-800">{result.assigned_to.full_name}</div>
              </div>
            )}
          </div>

          <button
            onClick={onNew}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            Submit Another Idea
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function PublicIdeaSubmissionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Employee lookup
  const [employeeId, setEmployeeId]       = useState(searchParams.get('emp') ?? '')
  const [employeeIdInput, setEmployeeIdInput] = useState(searchParams.get('emp') ?? '')
  const [profile, setProfile]             = useState<PublicEmployeeProfile | null>(null)
  const [lookupError, setLookupError]     = useState<string | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)

  // Form state — operational details
  const [plantId, setPlantId]           = useState('')
  const [zoneId, setZoneId]             = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [functionId, setFunctionId]     = useState('')
  const [hallId, setHallId]             = useState('')
  const [locationId, setLocationId]     = useState('')
  const [valueStream, setValueStream]   = useState('')
  const [categoryId, setCategoryId]     = useState('')
  const [subCategoryId, setSubCategoryId] = useState('')

  // Idea content
  const [problemStatement, setProblemStatement] = useState('')
  const [description, setDescription]           = useState('')
  const [remarks, setRemarks]                   = useState('')
  const [isAnonymous, setIsAnonymous]           = useState(false)

  // File upload
  const [uploadedFiles, setUploadedFiles]     = useState<{ id: string; name: string }[]>([])
  const [uploadingFile, setUploadingFile]     = useState(false)
  const [uploadError, setUploadError]         = useState<string | null>(null)

  // Submission
  const [submitError, setSubmitError]   = useState<string | null>(null)
  const [result, setResult]             = useState<PublicSubmitResult | null>(null)

  // Master data
  const { data: master } = useQuery({
    queryKey: ['public-master-data'],
    queryFn:  getPublicMasterData,
    staleTime: 10 * 60 * 1000,
  })

  // Cascading filter logic
  const filteredZones      = useMemo(() => master?.zones.filter((z) => z.plant_id === plantId) ?? [], [master, plantId])
  const filteredDepts      = useMemo(() => master?.departments.filter((d) => d.zone_id === zoneId) ?? [], [master, zoneId])
  const filteredFunctions  = useMemo(() => master?.functions.filter((f) => f.department_id === departmentId) ?? [], [master, departmentId])
  const filteredHalls      = useMemo(() => master?.halls.filter((h) => h.function_id === functionId) ?? [], [master, functionId])
  const filteredLocations  = useMemo(() => master?.locations.filter((l) => l.hall_id === hallId) ?? [], [master, hallId])
  const filteredSubCats    = useMemo(() => master?.sub_categories.filter((s) => s.category_id === categoryId) ?? [], [master, categoryId])

  // Employee lookup handler
  const handleLookup = async (id = employeeIdInput) => {
    const trimmed = id.trim()
    if (!trimmed) return
    setLookupLoading(true)
    setLookupError(null)
    setProfile(null)
    try {
      const emp = await lookupEmployee(trimmed)
      setProfile(emp)
      setEmployeeId(trimmed)
      // Pre-fill from home assignment
      if (emp.home_plant)      setPlantId(emp.home_plant.id)
      if (emp.home_zone)       setZoneId(emp.home_zone.id)
      if (emp.home_department) setDepartmentId(emp.home_department.id)
      if (emp.home_function)   setFunctionId(emp.home_function.id)
      if (emp.home_hall)       setHallId(emp.home_hall.id)
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Employee not found')
    } finally {
      setLookupLoading(false)
    }
  }

  // File upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !employeeId) return
    if (uploadedFiles.length >= 5) { setUploadError('Maximum 5 files allowed'); return }
    setUploadingFile(true)
    setUploadError(null)
    try {
      const res = await uploadPublicFile(file, employeeId)
      setUploadedFiles((prev) => [...prev, { id: res.file_id, name: res.file_name }])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const submitMutation = useMutation({
    mutationFn: submitPublicIdea,
    onSuccess: (data) => setResult(data),
    onError:   (err) => setSubmitError(err instanceof Error ? err.message : 'Submission failed'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (!profile) { setSubmitError('Please look up your Employee ID first'); return }
    if (!plantId || !zoneId || !departmentId || !categoryId) {
      setSubmitError('Please fill in all required fields')
      return
    }
    if (problemStatement.length < 10 || description.length < 10) {
      setSubmitError('Problem statement and idea description must each be at least 10 characters')
      return
    }

    submitMutation.mutate({
      employee_id:       employeeId,
      plant_id:          plantId,
      zone_id:           zoneId,
      department_id:     departmentId,
      category_id:       categoryId,
      problem_statement: problemStatement,
      description,
      ...(functionId     ? { function_id:     functionId     } : {}),
      ...(hallId         ? { hall_id:         hallId         } : {}),
      ...(locationId     ? { location_id:     locationId     } : {}),
      ...(valueStream    ? { value_stream:    valueStream    } : {}),
      ...(subCategoryId  ? { sub_category_id: subCategoryId  } : {}),
      ...(remarks        ? { remarks                         } : {}),
      is_anonymous:      isAnonymous,
      ...(uploadedFiles.length ? { attachment_file_ids: uploadedFiles.map((f) => f.id) } : {}),
    })
  }

  const handleReset = () => {
    setResult(null)
    setProfile(null)
    setEmployeeIdInput('')
    setEmployeeId('')
    setPlantId(''); setZoneId(''); setDepartmentId(''); setFunctionId('')
    setHallId(''); setLocationId(''); setValueStream('')
    setCategoryId(''); setSubCategoryId('')
    setProblemStatement(''); setDescription(''); setRemarks('')
    setIsAnonymous(false)
    setUploadedFiles([])
    setLookupError(null); setSubmitError(null)
  }

  if (result) return <SuccessScreen result={result} onNew={handleReset} />

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader />

      <div className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Submit a Kaizen Idea</h1>
        <p className="text-sm text-gray-500 mb-6">No login required — enter your Employee ID to get started</p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Section 1: Idea Owner Details ── */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <SectionTitle title="Idea Owner Details" />
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Employee ID lookup */}
              <div>
                <Label text="Employee ID" required />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={employeeIdInput}
                    onChange={(e) => setEmployeeIdInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleLookup() } }}
                    placeholder="e.g. EMP001"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => void handleLookup()}
                    disabled={lookupLoading || !employeeIdInput.trim()}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {lookupLoading ? '…' : 'Search'}
                  </button>
                </div>
                {lookupError && <p className="text-xs text-red-500 mt-1">{lookupError}</p>}
              </div>

              {/* Employee Name */}
              <div>
                <Label text="Employee Name" />
                <input
                  type="text"
                  value={profile?.full_name ?? ''}
                  readOnly
                  placeholder="Auto-filled after lookup"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700"
                />
              </div>

              {/* Zone of Owner */}
              <div>
                <Label text="Zone of Idea Owner" />
                <input
                  type="text"
                  value={profile?.home_zone?.name ?? ''}
                  readOnly
                  placeholder="Auto-filled after lookup"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700"
                />
              </div>

              {/* Hall of Owner */}
              <div>
                <Label text="Hall of Idea Owner" />
                <input
                  type="text"
                  value={profile?.home_hall?.name ?? ''}
                  readOnly
                  placeholder="Auto-filled after lookup"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700"
                />
              </div>
            </div>
          </div>

          {/* ── Section 2: Operational Details ── */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <SectionTitle title="Operational Details" />
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              <div>
                <Label text="Plant" required />
                <Select value={plantId} onChange={(v) => { setPlantId(v); setZoneId(''); setDepartmentId(''); setFunctionId(''); setHallId(''); setLocationId('') }}>
                  {master?.plants.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                </Select>
              </div>

              <div>
                <Label text="Zone" required />
                <Select value={zoneId} onChange={(v) => { setZoneId(v); setDepartmentId(''); setFunctionId(''); setHallId(''); setLocationId('') }} disabled={!plantId}>
                  {filteredZones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </Select>
              </div>

              <div>
                <Label text="Department" required />
                <Select value={departmentId} onChange={(v) => { setDepartmentId(v); setFunctionId(''); setHallId(''); setLocationId('') }} disabled={!zoneId}>
                  {filteredDepts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </div>

              <div>
                <Label text="Function" />
                <Select value={functionId} onChange={(v) => { setFunctionId(v); setHallId(''); setLocationId('') }} disabled={!departmentId}>
                  {filteredFunctions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </Select>
              </div>

              <div>
                <Label text="Hall" />
                <Select value={hallId} onChange={(v) => { setHallId(v); setLocationId('') }} disabled={!functionId}>
                  {filteredHalls.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </Select>
              </div>

              <div>
                <Label text="Location" />
                <Select value={locationId} onChange={setLocationId} disabled={!hallId}>
                  {filteredLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </Select>
              </div>

              <div>
                <Label text="Value Stream" />
                <input
                  type="text"
                  value={valueStream}
                  onChange={(e) => setValueStream(e.target.value)}
                  placeholder="Optional"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <Label text="Category" required />
                <Select value={categoryId} onChange={(v) => { setCategoryId(v); setSubCategoryId('') }}>
                  {master?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>

              <div>
                <Label text="Sub-Category" />
                <Select value={subCategoryId} onChange={setSubCategoryId} disabled={!categoryId}>
                  {filteredSubCats.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </div>
            </div>
          </div>

          {/* ── Section 3: Idea Details ── */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <SectionTitle title="Idea Details" />
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label text="Problem Statement" required />
                <TextArea
                  value={problemStatement}
                  onChange={setProblemStatement}
                  placeholder="Describe the current problem or waste..."
                  rows={5}
                  required
                />
              </div>
              <div>
                <Label text="Idea Description" required />
                <TextArea
                  value={description}
                  onChange={setDescription}
                  placeholder="Describe your proposed improvement..."
                  rows={5}
                  required
                />
              </div>
            </div>
          </div>

          {/* ── Section 4: Supporting Document ── */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <SectionTitle title="Supporting Document" />
            <div className="p-5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile || !profile || uploadedFiles.length >= 5}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {uploadingFile ? 'Uploading…' : 'Browse File'}
                </button>
                <span className="text-xs text-gray-400">PDF, Word, Excel, Image — max 10 MB (up to 5 files)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                  onChange={(e) => void handleFileChange(e)}
                  className="hidden"
                />
              </div>
              {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
              {!profile && <p className="text-xs text-amber-600 mt-2">Look up your Employee ID before uploading files</p>}
              {uploadedFiles.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {uploadedFiles.map((f) => (
                    <li key={f.id} className="flex items-center gap-2 text-xs text-gray-600">
                      <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f.name}
                      <button
                        type="button"
                        onClick={() => setUploadedFiles((p) => p.filter((x) => x.id !== f.id))}
                        className="text-gray-400 hover:text-red-500 ml-auto"
                      >×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── Section 5: Additional Details ── */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <SectionTitle title="Additional Details" />
            <div className="p-5 space-y-4">
              <div>
                <Label text="Remarks" />
                <TextArea
                  value={remarks}
                  onChange={setRemarks}
                  placeholder="Any additional comments (optional)"
                  rows={3}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setIsAnonymous((v) => !v)}
                  className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${isAnonymous ? 'bg-red-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isAnonymous ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">Submit Anonymously</div>
                  <div className="text-xs text-gray-500">Your name will be hidden from reviewers</div>
                </div>
              </label>
            </div>
          </div>

          {/* ── Error + Actions ── */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {submitError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pb-8">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitMutation.isPending || !profile}
              className="px-8 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {submitMutation.isPending ? 'Submitting…' : 'Submit Idea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
