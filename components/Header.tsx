"use client";

import { ArrowPathIcon } from "@heroicons/react/24/outline";
import SearchBar from "./SearchBar";

export default function Header({
  title,
  search,
  refresh,
  actionButton,
}: {
  title: string;
  search?: {
    search: (query: string) => void;
    query: string;
    resultsCount: number;
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
          {search && <SearchBar {...search} />}
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
