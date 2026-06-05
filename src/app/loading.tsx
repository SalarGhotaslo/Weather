import s from "./components/skeleton.module.css";

export default function Loading() {
  return (
    <div className={s.shell}>
      <div className={s.header} />

      <div className={s.container4}>
        <div className={`${s.line} h-3 w-32 mb-5`} />

        <div className={`${s.line} h-7 w-64 mb-2`} />
        <div className={`${s.line} h-3 w-44 mb-5`} />

        <div className={`${s.boxXl} h-44 mb-3`} />

        <div className="grid grid-cols-3 gap-2 mb-6 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${s.box} h-16`} />
          ))}
        </div>

        <div className={`${s.line} h-4 w-28 mb-3`} />
        <div className="grid grid-cols-5 gap-2 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`${s.box} h-32`} />
          ))}
        </div>

        <div className={`${s.boxXl} h-20`} />
      </div>
    </div>
  );
}
