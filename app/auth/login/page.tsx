"use client";

import { FormTextField } from "@/components/forms/FormTextField";
import SubmitButton from "@/components/forms/SubmitButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  email: z.string().email("Zadajte platný email"),
  password: z.string({ required_error: "Zadajte heslo" }),
});

export type FormValues = z.infer<typeof formSchema>;

export default function LoginForm({
  searchParams,
}: {
  searchParams: { next?: string; error?: string; email?: string };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      email: searchParams.email || "",
      password: "",
    },
    resolver: zodResolver(formSchema),
  });
  const email = form.watch("email");

  const signIn = async (values: FormValues) => {
    const { error } =
      await createBrowserSupabase().auth.signInWithPassword(values);

    if (error) {
      setError(error.message);
      return;
    }
    setError(null);
    router.replace((searchParams.next as Route) || "/dashboard");
  };

  return (
    <div className="grid h-full w-full place-content-center animate-in">
      <div className="flex w-80 flex-col">
        <h1 className="pb-6 text-lg font-medium">
          Prihláste sa do svojho účtu
        </h1>
        <Form
          form={form}
          onSubmit={signIn}
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
            autoComplete="current-password"
          />
          {searchParams.error && (
            <Alert variant={"destructive"}>
              <ExclamationTriangleIcon className="mr-2 h-4 w-4" />
              <AlertTitle>Chyba</AlertTitle>
              <AlertDescription>{searchParams.error}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant={"destructive"}>
              <ExclamationTriangleIcon className="mr-2 h-4 w-4" />
              <AlertTitle>Chyba pri prihlasovaní</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <SubmitButton
            form={form}
            allowSubmitDefault
            label="Prihlásiť"
            submittingLabel="Prihlasujem..."
          />
        </Form>
        <div className="flex pt-4">
          <Button variant="ghost" className="grow text-gray-600" asChild>
            <Link href={`/auth/signup?email=${email}`}>Vytvoriť účet</Link>
          </Button>
          <Button variant="ghost" className="grow text-gray-600" asChild>
            <Link href={`/auth/forgot-password?email=${email}`}>
              Zabudli ste heslo?
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
