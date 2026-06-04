"use client";

import { useEffect } from "react";
import { recordRecentSearch } from "./RecentSearches";

export default function SearchTracker({ cityLabel }: { cityLabel: string }) {
  useEffect(() => {
    if (cityLabel) recordRecentSearch(cityLabel);
  }, [cityLabel]);

  return null;
}
