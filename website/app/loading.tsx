export default function Loading() {
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 p-2 md:p-4">
      <div className="flex overflow-hidden gap-4 pb-4 md:grid md:grid-cols-2 lg:grid-cols-6 md:pb-0 md:mb-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-200/50 animate-pulse rounded-xl h-24 min-w-[200px] md:min-w-0" />
        ))}
      </div>
      <div className="flex-1 flex overflow-hidden rounded-xl border shadow-sm bg-white">
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50/50 z-50">
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="w-16 h-16 bg-slate-200 rounded-xl" />
            <div className="w-48 h-4 bg-slate-200 rounded" />
            <div className="w-32 h-3 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
