import s from "../components/skeleton.module.css";

export default function Loading() {
  return (
    <div className={s.shell}>
      <div className={s.header} />
      <div className={s.container5}>
        <div className={`${s.line} h-3 w-32 mb-5`} />
        <div className={`${s.line} h-8 w-48 mb-2`} />
        <div className={`${s.line} h-3 w-64 mb-6`} />
        {/* Filter bar */}
        <div className="flex gap-2 mb-6">
          <div className={`${s.box} flex-1 h-10`} />
          <div className={`${s.box} h-10 w-36`} />
        </div>
        {/* Country grid */}
        {Array.from({ length: 4 }).map((_, gi) => (
          <div key={gi} className="mb-8">
            <div className={`${s.line} h-4 w-6 mb-3`} />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`${s.box} h-12`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
