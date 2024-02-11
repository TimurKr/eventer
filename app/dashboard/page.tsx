import { permanentRedirect, useRouter } from "next/navigation";
import { useStoreContext } from "./store";

export default function Page() {
  return permanentRedirect("/dashboard/events");
}
