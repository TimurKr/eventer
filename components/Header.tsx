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
      <div className="sticky top-0 z-20 flex flex-wrap justify-end gap-4 gap-y-2 bg-inherit p-4">
        <span className="order-1 me-auto text-2xl font-bold tracking-wider">
          {title}
        </span>
        <div className="order-3 flex gap-2 sm:order-2">
          {search && <SearchBar {...search} />}
          {refresh &&
            (!!refresh.refresh ? (
              <button
                className="flex items-center gap-2 rounded-md border border-gray-200 p-1 px-2 text-sm font-normal hover:bg-gray-100 disabled:cursor-wait disabled:bg-gray-100"
                onClick={refresh.refresh}
                disabled={refresh.isRefreshing}
              >
                <ArrowPathIcon
                  className={`h-5 w-5 ${refresh.isRefreshing && "animate-spin"}`}
                />
                Obnoviť
              </button>
            ) : (
              refresh.isRefreshing && (
                <div className="grid h-full items-center px-2">
                  <ArrowPathIcon
                    className={`h-5 w-5 ${refresh.isRefreshing && "animate-spin"}`}
                  />
                </div>
              )
            ))}
        </div>
        <div className="order-2 sm:order-3">{actionButton}</div>
      </div>
    </>
  );
}
