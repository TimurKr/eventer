"use client";

import { FormTextField } from "@/components/forms/FormTextField";
import SubmitButton from "@/components/forms/SubmitButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z
  .object({
    email: z.string().email("Zadajte platný email"),
    password: z.string({ required_error: "Zadajte heslo" }),
    confirm: z.string({ required_error: "Zadajte heslo znovu" }),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Heslá sa nezhodujú",
    path: ["confirmPassword"],
  });

export type SignupFormValues = z.infer<typeof formSchema>;

export default function SignUpForm({
  searchParams,
}: {
  searchParams: { next?: string; email?: string };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignupFormValues>({
    defaultValues: {
      email: searchParams.email || "",
      password: "",
      confirm: "",
    },
    resolver: zodResolver(formSchema),
  });

  const email = form.watch("email");

  const signUp = async (values: SignupFormValues) => {
    const { error } = await createBrowserSupabase().auth.signUp(values);

    if (error) {
      setError(error.message);
      return;
    }
    router.replace((searchParams.next as Route) || "/dashboard");
  };

  return (
    <div className="grid h-full w-full place-content-center animate-in">
      <div className="flex w-80 flex-col">
        <h1 className="pb-6 text-lg font-medium">Vytvorte si účet</h1>
        <Form
          form={form}
          onSubmit={signUp}
          className="flex w-full flex-1 flex-col justify-center gap-4 text-foreground"
        >
          <FormTextField
            form={form}
            name="email"
            label="Email"
            placeholder="Zadajte email"
            autoComplete="email"
          />
          <FormTextField
            form={form}
            name="password"
            label="Heslo"
            type="password"
            placeholder="Zadajte heslo"
            autoComplete="new-password"
            className="pr-32"
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
                  <ArrowPathIcon className="me-2 h-4 w-4" />
                  Generate
                </Button>
              ),
            }}
          />
          <FormTextField
            form={form}
            name="confirm"
            label="Heslo znovu"
            type="password"
            placeholder="Zadajte heslo znovu"
            autoComplete="off"
          />
          {error && (
            <Alert variant={"destructive"}>
              <ExclamationTriangleIcon className="mr-2 h-4 w-4" />
              <AlertTitle>Chyba pri vytváraní účtu</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <SubmitButton
            isSubmitting={form.formState.isSubmitting}
            label="Vytvoriť účet"
            submittingLabel="Vytváram..."
          />
          <Button
            type="button"
            variant="ghost"
            className="text-gray-600"
            asChild
          >
            <Link href={`/auth/login?email=${email}`}>
              Máte už účet? Prihláste sa
            </Link>
          </Button>
        </Form>
      </div>
    </div>
  );
}
