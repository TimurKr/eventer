"use client";

import InlineLoading from "@/components/InlineLoading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import PasswordChangeForm from "../../change-password/form";

export default function NewServiceModal() {
  const router = useRouter();

  const user = useUser();

  return (
    <>
      <Dialog open={true} onOpenChange={() => router.back()}>
        <DialogContent size={"xl"}>
          <DialogHeader>
            <DialogTitle>Zmena hesla</DialogTitle>
            <DialogDescription>
              Vymyslite si nové heslo pre účet{" "}
              {user.isFetching ? (
                <InlineLoading />
              ) : (
                user.user?.email || <span className="italic">neznámy</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <PasswordChangeForm />
        </DialogContent>
      </Dialog>
    </>
  );
}
