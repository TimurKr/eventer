import { Spinner } from "flowbite-react";

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-2 p-4">
      <Spinner />
      <p>Loading...</p>
    </div>
  );
}
