import { RocketLaunchIcon } from "@heroicons/react/24/solid";
import { PropsWithChildren } from "react";

export default function CreateFirst({
  children,
  text,
}: PropsWithChildren<{ text: string }>) {
  return (
    <div className="flex flex-col items-center p-10">
      <RocketLaunchIcon className="h-12 w-12 text-gray-400" />
      <p className="mb-12 mt-6 text-center text-xl font-medium tracking-wide text-gray-600">
        {text}
      </p>
      {children}
    </div>
  );
}
