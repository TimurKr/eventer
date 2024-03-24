import { ArrowPathIcon } from "@heroicons/react/24/outline";

// export default function Loading() {
//   return (
//     <div className="flex h-full w-full items-center justify-center gap-2 p-4">
//       <Spinner />
//       <p>Načítavam...</p>
//     </div>
//   );
// }

export default function Loading({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center p-10">
      <ArrowPathIcon className="w-12 animate-spin text-gray-400" />
      {text && (
        <p className="mb-12 mt-6 text-center text-xl font-medium tracking-wide text-gray-600">
          {text}
        </p>
      )}
    </div>
  );
}
