"use client";

import { FormTextField } from "@/components/forms/FormTextField";
import SubmitButton from "@/components/forms/SubmitButton";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";

const passwordForm = z
  .object({
    password: z.string(),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Heslá nie sú rovnaké",
    path: ["confirm"],
  });

type PasswordForm = z.infer<typeof passwordForm>;

export default function PasswordChangeForm({ next }: { next?: Route }) {
  const router = useRouter();

  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordForm),
  });

  const onSubmit = async (data: PasswordForm) => {
    const r = await createBrowserSupabase().auth.updateUser({
      password: data.password,
    });
    if (r.error) {
      form.setError("password", { message: r.error.message });
      form.setValue("confirm", "");
      return;
    }
    if (next) {
      router.push(next);
    } else {
      router.back();
    }
  };

  return (
    <Form form={form} onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormTextField
        form={form}
        label="Nové heslo"
        name="password"
        type="password"
        placeholder="Zadajte nové heslo"
        horizontal
        className="pr-16 sm:pr-32"
        autoComplete="new-password"
        icons={{
          end: (
            <Button
              variant={"ghost"}
              size={"xs"}
              type="button"
              onClick={() => {
                const newPassword = crypto.randomUUID();
                form.setValue("password", newPassword);
                form.setValue("confirm", newPassword);
              }}
              tabIndex={-1}
            >
              <ArrowPathIcon className="h-4 w-4 sm:me-2" />
              <span className="hidden sm:inline">Generate</span>
            </Button>
          ),
        }}
      />
      <FormTextField
        form={form}
        label="Potvrďte heslo"
        name="confirm"
        type="password"
        placeholder="Zopakujte nové heslo"
        horizontal
        autoComplete="off"
      />
      <div className="flex items-end justify-end gap-4">
        <Button
          variant={"secondary"}
          type="button"
          onClick={() => router.back()}
        >
          Zrušiť
        </Button>
        <SubmitButton form={form} className="self-end" />
      </div>
    </Form>
  );
}
