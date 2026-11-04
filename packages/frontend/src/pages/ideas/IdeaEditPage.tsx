import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getIdea, updateIdea, type UpdateIdeaRequest } from '../../api/ideas.js'
import { useToast } from '../../hooks/useToast.js'
import { PageTransition } from '../../components/PageTransition.js'
import { SkeletonDetail } from '../../components/Skeleton.js'

export function IdeaEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const { data: idea, isLoading } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => getIdea(id!),
    enabled: !!id,
  })

  const [form, setForm] = useState({
    title: '',
    description: '',
    problem_statement: '',
    proposed_solution: '',
    expected_benefits: '',
    remarks: '',
  })
  const [initialised, setInitialised] = useState(false)

  if (idea && !initialised) {
    setForm({
      title: idea.title ?? '',
      description: idea.description ?? '',
      problem_statement: idea.problem_statement ?? '',
      proposed_solution: idea.proposed_solution ?? '',
      expected_benefits: idea.expected_benefits ?? '',
      remarks: idea.remarks ?? '',
    })
    setInitialised(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const body: UpdateIdeaRequest = {}
      if (form.title.trim())              body.title              = form.title.trim()
      if (form.description.trim())        body.description        = form.description.trim()
      if (form.problem_statement.trim())  body.problem_statement  = form.problem_statement.trim()
      if (form.proposed_solution.trim())  body.proposed_solution  = form.proposed_solution.trim()
      if (form.expected_benefits.trim())  body.expected_benefits  = form.expected_benefits.trim()
      if (form.remarks.trim())            body.remarks            = form.remarks.trim()
      return updateIdea(id!, body)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['idea', id] })
      void queryClient.invalidateQueries({ queryKey: ['my-ideas'] })
      void queryClient.invalidateQueries({ queryKey: ['all-ideas'] })
      addToast('Idea updated successfully', 'success')
      navigate(`/ideas/${id}`)
    },
    onError: (err: Error) => addToast(err.message, 'error'),
  })

  if (isLoading || !idea) {
    return (
      <PageTransition>
        <div className="max-w-3xl"><SkeletonDetail /></div>
      </PageTransition>
    )
  }

  if (!['DRAFT', 'RETURNED'].includes(idea.status)) {
    return (
      <PageTransition>
        <div className="max-w-3xl flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-slate-400 text-sm">This idea cannot be edited in its current state ({idea.status}).</p>
          <button onClick={() => navigate(`/ideas/${id}`)} className="text-indigo-400 text-sm hover:underline">
            ← Back to idea
          </button>
        </div>
      </PageTransition>
    )
  }

  const field = (label: string, key: keyof typeof form, rows = 3, required = false) => (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <textarea
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        rows={rows}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
      />
    </div>
  )

  return (
    <PageTransition>
      <div className="max-w-3xl">
        <button
          onClick={() => navigate(`/ideas/${id}`)}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
        >
          ← Back
        </button>

        <div className="glass rounded-2xl p-6">
          <div className="mb-6">
            <h1 className="text-lg font-bold text-white">Edit Idea</h1>
            <p className="text-xs text-slate-500 mt-1">
              {idea.registration_id ?? 'Draft'} · Status: {idea.status}
            </p>
          </div>

          <div className="space-y-5">
            {field('Title', 'title', 2)}
            {field('Description', 'description', 3, true)}
            {field('Problem Statement', 'problem_statement', 4, true)}
            {field('Proposed Solution', 'proposed_solution', 3)}
            {field('Expected Benefits', 'expected_benefits', 3)}
            {field('Remarks', 'remarks', 2)}
          </div>

          <div className="flex gap-3 mt-6 pt-5 border-t border-white/5">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.description.trim() || !form.problem_statement.trim()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              onClick={() => navigate(`/ideas/${id}`)}
              className="px-6 py-2.5 glass rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
