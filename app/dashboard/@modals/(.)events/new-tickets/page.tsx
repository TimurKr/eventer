"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import NewTicketsForm from "../../../events/new-tickets/form";

export default function NewServiceModal() {
  const router = useRouter();

  return (
    <Dialog open={true} onOpenChange={() => router.back()}>
      <DialogTrigger />
      <DialogContent size={"2xl"} className="max-h-screen overflow-y-scroll">
        <DialogHeader>Vytvorte nové lístky</DialogHeader>
        <NewTicketsForm />
      </DialogContent>
    </Dialog>
  );
}
