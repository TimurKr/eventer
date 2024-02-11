"use client";

import { useRouter } from "next/navigation";
import { useStoreContext } from "./store";

export default function Page() {
  const router = useRouter();

  const { allServices } = useStoreContext((state) => state.services);

  if (allServices.length === 0) {
    return router.push("/dashboard/services");
  }
  return router.push("/dashboard/events");
}
