export function MatchResultEmpty({ recruiter = false }: { recruiter?: boolean }) {
  return (
    <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-xl font-semibold text-slate-500">
        AI
      </div>
      <h2 className="mt-5 text-xl font-semibold text-slate-950">No match result yet</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {recruiter
          ? 'Run baseline matching after the CV has been parsed to generate the score breakdown and skill gaps.'
          : 'The analysis has not been completed yet. Your application remains available while matching is pending.'}
      </p>
    </section>
  );
}
