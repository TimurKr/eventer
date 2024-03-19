"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { XCircleIcon } from "@heroicons/react/24/solid";

export default function SearchBar({
  query,
  search,
  resultsCount,
  selectFirstResult,
}: {
  query: string;
  search: (query: string) => void;
  resultsCount: number;
  selectFirstResult?: () => void;
}) {
  return (
    <div className="relative max-w-64 shrink">
      <div className="pointer-events-none absolute left-0 top-0 grid h-full place-content-center px-2">
        <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
      </div>
      {query && (
        <button
          onClick={() => search("")}
          className="absolute right-0 top-0 grid h-full place-content-center px-2 text-gray-400 hover:scale-105 hover:text-gray-500 active:text-gray-600"
        >
          <XCircleIcon className="h-4 w-4" />
        </button>
      )}
      <div
        className={`absolute bottom-0.5 left-8 h-0 overflow-hidden text-xs text-gray-500 ${
          query ? "h-4" : ""
        } transition-all duration-300 ease-in-out`}
      >
        {resultsCount} výsledkov
      </div>
      <input
        type="text"
        name="search"
        className={`z-10 w-full rounded-md border-gray-200 bg-transparent px-8 py-0.5 ${
          query ? "pb-4" : ""
        } transition-all duration-300 ease-in-out`}
        placeholder="Hladať"
        value={query}
        onChange={(e) => search(e.target.value)}
        onKeyDown={(e) => {
          if (e.key == "Escape") {
            (e.target as HTMLInputElement).blur();
          }
          if (e.key == "Enter") {
            search(query);
          }
          if (e.key == "ArrowDown") {
            selectFirstResult?.();
          }
        }}
      />
    </div>
  );
}
