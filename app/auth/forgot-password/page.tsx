"use client";

import { FormTextField } from "@/components/forms/FormTextField";
import SubmitButton from "@/components/forms/SubmitButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  email: z.string().email("Zadajte platný email"),
});

type FormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordForm({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      email: searchParams.email || "",
    },
    resolver: zodResolver(formSchema),
  });

  const email = form.watch("email");

  const resetPassword = async ({ email }: FormValues) => {
    const l = location.origin;
    const res = await createBrowserSupabase().auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${location.origin}/dashboard/change-password`,
      },
    );
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setEmailSent(true);
    return;
  };

  return (
    <div className="grid h-full w-full place-content-center animate-in">
      <div className="flex w-80 flex-col">
        <h1 className="pb-6 text-lg font-medium">
          {emailSent ? "Email odoslaný" : "Zabudli ste heslo?"}
        </h1>
        {emailSent ? (
          <div className="flex flex-col text-sm text-gray-600">
            <p>
              Na uvedenú emailovú adresu sme odoslali mail s inštrukciami na
              obnovenie vášho hesla. Ak vám mail neprišiel, skontrolujte si,
              prosím, aj spam.
            </p>
            <p className="pt-4">
              Emailová adresa:{" "}
              <span className="font-medium">{form.getValues().email}</span>
            </p>
            <Button
              variant="link"
              onClick={() => setEmailSent(false)}
              className="mx-auto mt-4"
            >
              Zadať inú emailovú adresu
            </Button>
          </div>
        ) : (
          <h2 className="pb-6 text-sm font-medium text-gray-600">
            Zadajte svoj email, ak u nás máte účet, pošleme vám link na
            nastavenie nového hesla
          </h2>
        )}
        {emailSent || (
          <>
            <Form
              form={form}
              onSubmit={resetPassword}
              className="flex w-full flex-1 flex-col justify-center gap-4 text-foreground"
            >
              <FormTextField
                form={form}
                name="email"
                label="Email"
                placeholder="Zadajte email"
                autoComplete="email"
              />
              {error && (
                <Alert variant={"destructive"}>
                  <AlertTitle>Chyba pri odoslaní hesla</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <SubmitButton
                form={form}
                allowSubmitDefault
                label="Odoslať email"
                submittingLabel="Odosielam..."
              />
            </Form>
            <div className="flex pt-4">
              <Button variant="ghost" className="grow text-gray-600" asChild>
                <Link href={`/auth/signup?email=${email}`}>
                  Vytvoriť nový účet
                </Link>
              </Button>
              <Button variant="ghost" className="grow text-gray-600" asChild>
                <Link href={`/auth/login?email=${email}`}>Už viem heslo!</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
