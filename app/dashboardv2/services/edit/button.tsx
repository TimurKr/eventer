import { PlusCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function NewServiceButton() {
  return (
    <Link
      className="flex items-center gap-2 rounded-md bg-green-500 px-2 py-1 text-sm text-white hover:bg-green-600"
      href="/dashboard/services/edit"
    >
      <PlusCircleIcon className="h-5 w-5" />
      Nové predstavenie
    </Link>
  );
}
