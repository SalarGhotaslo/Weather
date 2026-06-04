export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0e1723] flex flex-col">
      <div className="bg-[#121f2f] border-b border-[#1e3347] h-14 animate-pulse" />
      <div className="mx-auto w-full max-w-5xl px-4 py-6 flex-1 animate-pulse">
        <div className="h-3 bg-[#162535] rounded w-32 mb-5" />
        <div className="h-8 bg-[#162535] rounded w-48 mb-2" />
        <div className="h-3 bg-[#162535] rounded w-64 mb-6" />
        {/* Filter bar */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 bg-[#162535] rounded-lg h-10" />
          <div className="bg-[#162535] rounded-lg h-10 w-36" />
        </div>
        {/* Country grid */}
        {Array.from({ length: 4 }).map((_, gi) => (
          <div key={gi} className="mb-8">
            <div className="h-4 bg-[#162535] rounded w-6 mb-3" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-[#162535] rounded-lg h-12" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
