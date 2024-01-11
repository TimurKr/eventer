import { redirect } from "next/navigation";

export default function Page() {
  redirect("/dashboard/events");
  return <h1>Hello, Dashboard Page!</h1>;
}
