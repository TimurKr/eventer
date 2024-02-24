import { permanentRedirect } from "next/navigation";

export default function Page() {
  return permanentRedirect("/dashboardv2/events");
}
