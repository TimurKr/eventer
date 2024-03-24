import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { PropsWithChildren } from "react";

export default function NoResults({
  children,
  text,
}: PropsWithChildren<{ text: string }>) {
  return (
    <div className="flex flex-col items-center p-10">
      <MagnifyingGlassIcon className="w-12 animate-wiggle text-gray-400" />
      <p className="mb-12 mt-6 text-center text-xl font-medium tracking-wide text-gray-600">
        {text}
      </p>
      {children}
    </div>
  );
}
