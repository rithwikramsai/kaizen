export function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-5 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-white/10 rounded-md w-24" />
        <div className="h-5 bg-white/10 rounded-full w-20" />
      </div>
      <div className="h-5 bg-white/10 rounded-lg w-3/4" />
      <div className="h-4 bg-white/10 rounded-lg w-1/2" />
      <div className="flex gap-2 pt-1">
        <div className="h-4 w-16 bg-white/10 rounded-full" />
        <div className="h-4 w-20 bg-white/10 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="h-3 w-20 bg-white/10 rounded-full" />
        <div className="h-3 w-4 bg-white/10 rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonDetail() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-white/10 rounded-full w-24" />
      <div className="h-7 bg-white/10 rounded-xl w-2/3" />
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="h-3 bg-white/10 rounded-full w-20" />
        <div className="space-y-2">
          <div className="h-3 bg-white/10 rounded-full" />
          <div className="h-3 bg-white/10 rounded-full w-5/6" />
          <div className="h-3 bg-white/10 rounded-full w-4/6" />
        </div>
      </div>
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="h-3 bg-white/10 rounded-full w-28" />
        <div className="space-y-2">
          <div className="h-3 bg-white/10 rounded-full" />
          <div className="h-3 bg-white/10 rounded-full w-5/6" />
        </div>
      </div>
    </div>
  )
}
