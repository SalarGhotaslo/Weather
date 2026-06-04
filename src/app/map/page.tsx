import Header from "@/app/components/Header";
import WorldMapLoader from "@/app/components/WorldMapLoader";

export default function MapPage() {
  return (
    <div className="h-screen bg-[#0e1723] flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 flex flex-col min-h-0">
        <WorldMapLoader />
      </main>
    </div>
  );
}
