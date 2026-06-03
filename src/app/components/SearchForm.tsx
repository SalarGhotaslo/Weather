export default function SearchForm({
  defaultValue = "",
  large = false,
}: {
  defaultValue?: string;
  large?: boolean;
}) {
  return (
    <form method="GET" action="/" className="flex gap-2">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search for a city…"
        required
        autoComplete="off"
        className={`flex-1 rounded-xl bg-white/20 px-4 text-white placeholder-sky-200 outline-none ring-2 ring-transparent backdrop-blur-md transition focus:ring-white/50 ${large ? "py-4 text-lg" : "py-2 text-sm"}`}
      />
      <button
        type="submit"
        className={`rounded-xl bg-white/30 font-medium text-white backdrop-blur-md transition hover:bg-white/40 active:scale-95 ${large ? "px-6 py-4 text-lg" : "px-4 py-2 text-sm"}`}
      >
        Search
      </button>
    </form>
  );
}
