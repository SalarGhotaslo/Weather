export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0e1723] flex flex-col">
      <div className="bg-[#121f2f] border-b border-[#1e3347] h-14 animate-pulse" />
      <div className="mx-auto w-full max-w-4xl px-4 py-6 flex-1 animate-pulse">
        <div className="h-3 bg-[#162535] rounded w-48 mb-4" />
        <div className="flex gap-1.5 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-[#162535] rounded-lg h-8 w-20" />
          ))}
        </div>
        <div className="bg-[#162535] rounded-xl h-48 mb-3" />
        <div className="grid grid-cols-3 gap-2 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#162535] rounded-lg h-16" />
          ))}
        </div>
        <div className="bg-[#162535] rounded-xl h-64 mb-3" />
        <div className="bg-[#162535] rounded-xl h-40 mb-3" />
        <div className="bg-[#162535] rounded-xl h-20" />
      </div>
    </div>
  );
}
