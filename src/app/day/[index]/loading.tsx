import s from "../../components/skeleton.module.css";

export default function Loading() {
  return (
    <div className={s.shell}>
      <div className={s.header} />
      <div className={s.container4}>
        <div className={`${s.line} h-3 w-48 mb-4`} />
        <div className="flex gap-1.5 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`${s.box} h-8 w-20`} />
          ))}
        </div>
        <div className={`${s.boxXl} h-48 mb-3`} />
        <div className="grid grid-cols-3 gap-2 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${s.box} h-16`} />
          ))}
        </div>
        <div className={`${s.boxXl} h-64 mb-3`} />
        <div className={`${s.boxXl} h-40 mb-3`} />
        <div className={`${s.boxXl} h-20`} />
      </div>
    </div>
  );
}
