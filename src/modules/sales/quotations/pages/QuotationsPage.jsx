export function QuotationsPage() {
  return (
    <div className="w-full h-[calc(100vh-100px)] rounded-xl border border-slate-200 bg-slate-900 overflow-hidden shadow-lg">
      <iframe
        src="/quotation-planner/"
        className="w-full h-full border-none"
        title="Quotation Box Planner"
      />
    </div>
  )
}
