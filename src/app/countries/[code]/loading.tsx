import s from "@/app/components/skeleton.module.css";

export default function Loading() {
  return (
    <div className={s.shell}>
      <div className={s.header} />
      <div className={s.container5}>
        {/* Breadcrumb skeleton */}
        <div className={`${s.line} h-3 w-48 mb-5`} />
        {/* Hero card */}
        <div className={`${s.boxXl} p-6 mb-6`}>
          <div className="flex gap-4">
            <div className={`${s.box} w-12 h-12 rounded-full`} />
            <div className="flex-1">
              <div className={`${s.line} h-6 w-48 mb-2`} />
              <div className={`${s.line} h-3 w-80 mb-2`} />
              <div className={`${s.line} h-3 w-64`} />
            </div>
          </div>
        </div>
        {/* Cities section */}
        <div className={`${s.line} h-5 w-16 mb-1`} />
        <div className={`${s.line} h-3 w-64 mb-4`} />
        {/* Search + filter skeleton */}
        <div className="flex gap-2 mb-5">
          <div className={`${s.box} flex-1 h-10`} />
        </div>
        {/* City grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 mb-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={`${s.box} h-14`} />
          ))}
        </div>
        {/* Region skeleton */}
        <div className={`${s.line} h-5 w-40 mb-3`} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${s.box} h-12`} />
          ))}
        </div>
      </div>
    </div>
  );
}
