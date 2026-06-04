export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0e1723] flex flex-col">
      {/* Header skeleton */}
      <div className="bg-[#121f2f] border-b border-[#1e3347] h-14 animate-pulse" />

      <div className="mx-auto w-full max-w-4xl px-4 py-6 flex-1 animate-pulse">
        {/* Breadcrumb */}
        <div className="h-3 bg-[#162535] rounded w-32 mb-5" />

        {/* Location title */}
        <div className="h-7 bg-[#162535] rounded w-64 mb-2" />
        <div className="h-3 bg-[#162535] rounded w-44 mb-5" />

        {/* Hero card */}
        <div className="bg-[#162535] rounded-xl h-44 mb-3" />

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2 mb-6 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#162535] rounded-lg h-16" />
          ))}
        </div>

        {/* Forecast grid */}
        <div className="h-4 bg-[#162535] rounded w-28 mb-3" />
        <div className="grid grid-cols-5 gap-2 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-[#162535] rounded-lg h-32" />
          ))}
        </div>

        {/* Fact card */}
        <div className="bg-[#162535] rounded-xl h-20" />
      </div>
    </div>
  );
}
