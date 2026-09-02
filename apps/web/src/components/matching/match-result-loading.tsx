export function MatchResultLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-64 rounded-3xl bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div className="h-44 rounded-2xl bg-slate-200" key={item} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((item) => (
          <div className="h-52 rounded-2xl bg-slate-200" key={item} />
        ))}
      </div>
    </div>
  );
}
