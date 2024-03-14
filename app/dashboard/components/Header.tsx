"use client";

import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { XCircleIcon } from "@heroicons/react/24/solid";

export default function Header({
  title,
  search,
  refresh,
  actionButton,
}: {
  title: string;
  search?: {
    search: (query: string) => void;
    searchTerm: string;
    results: number;
  };
  refresh?: {
    refresh?: () => void;
    isRefreshing: boolean;
  };
  actionButton?: React.ReactNode;
}) {
  return (
    <>
      <div className="sticky top-0 z-20 flex flex-wrap items-start gap-4 gap-y-2 bg-inherit p-4 ">
        <span className="text-2xl font-bold tracking-wider">{title}</span>
        <div className="ms-auto flex grow items-start justify-end gap-4">
          {search && (
            <div className="relative max-w-64 shrink">
              <div className="pointer-events-none absolute left-0 top-0 grid h-full place-content-center px-2">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
              </div>
              {search.searchTerm && (
                <button
                  onClick={() => search.search("")}
                  className="absolute right-0 top-0 grid h-full place-content-center px-2 text-gray-400 hover:scale-105 hover:text-gray-500 active:text-gray-600"
                >
                  <XCircleIcon className="h-4 w-4" />
                </button>
              )}
              <div
                className={`absolute bottom-0.5 left-8 h-0 overflow-hidden text-xs text-gray-500 ${
                  search.searchTerm ? "h-4" : ""
                } transition-all duration-300 ease-in-out`}
              >
                {search.results} výsledkov
              </div>
              <input
                type="text"
                name="search"
                className={`z-10 w-full rounded-md border-gray-200 bg-transparent px-8 py-0.5 ${
                  search.searchTerm ? "pb-4" : ""
                } transition-all duration-300 ease-in-out`}
                placeholder="Hladať"
                value={search.searchTerm}
                onChange={(e) => search.search(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key == "Escape") {
                    (e.target as HTMLInputElement).blur();
                  }
                  if (e.key == "Enter") {
                    search.search(search.searchTerm);
                  }
                }}
              />
            </div>
          )}
          {refresh && (!!refresh.refresh || refresh.isRefreshing) && (
            <button
              className="flex items-center gap-2 rounded-md border border-gray-200 p-1 px-2 text-sm font-normal hover:bg-gray-100"
              onClick={refresh.refresh}
            >
              <ArrowPathIcon
                className={`h-5 w-5 ${refresh.isRefreshing && "animate-spin"}`}
              />
              {refresh.refresh && "Obnoviť"}
            </button>
          )}
        </div>
        {actionButton}
      </div>
    </>
  );
}
