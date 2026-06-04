export default function SearchForm({
  defaultValue = "",
  large = false,
}: {
  defaultValue?: string;
  large?: boolean;
}) {
  if (large) {
    return (
      <form method="GET" action="/" className="flex gap-3">
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="Enter a city, town or postcode…"
          required
          autoComplete="off"
          className="flex-1 bg-[#1c2f3f] border border-[#2a4055] rounded-lg px-5 py-4 text-white placeholder-[#5a7d99] focus:outline-none focus:border-[#3b87d6] text-lg transition-colors"
        />
        <button
          type="submit"
          className="bg-[#2f6fb5] hover:bg-[#2d6fb8] active:bg-[#2560a0] text-white px-7 py-4 rounded-lg font-semibold transition-colors text-lg whitespace-nowrap"
        >
          Search
        </button>
      </form>
    );
  }

  return (
    <form method="GET" action="/" className="flex gap-2 flex-1">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search location…"
        required
        autoComplete="off"
        className="flex-1 min-w-0 bg-[#1c2f3f] border border-[#2a4055] rounded px-3 py-1.5 text-white placeholder-[#5a7d99] focus:outline-none focus:border-[#3b87d6] text-sm transition-colors"
      />
      <button
        type="submit"
        className="bg-[#2f6fb5] hover:bg-[#2d6fb8] active:bg-[#2560a0] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap"
      >
        Search
      </button>
    </form>
  );
}
