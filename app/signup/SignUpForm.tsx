"use client";

import SubmitButton from "@/components/forms/SubmitButton";
import { Alert } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useState, useTransition } from "react";

export default function LoginForm({
  action,
}: {
  action: (formData: FormData) => Promise<string | undefined>;
}) {
  const [isSubmitting, startSubmition] = useTransition();
  const [errorMess, setErrorMess] = useState<string | undefined>(undefined);
  return (
    <form
      className="flex w-full flex-1 flex-col justify-center gap-1 text-foreground"
      action={(e) => {
        startSubmition(async () => setErrorMess(await action(e)));
      }}
    >
      <label className="text-md" htmlFor="email">
        Email
      </label>
      <input
        className="mb-2 rounded-md border-gray-200 py-1"
        name="email"
        size={30}
        placeholder="you@example.com"
        required
      />
      <label className="text-md" htmlFor="password">
        Heslo
      </label>
      <input
        className="mb-2 rounded-md border-gray-200 py-1"
        type="password"
        size={30}
        name="password"
        placeholder="••••••••"
        required
      />
      <label className="text-md" htmlFor="password">
        Heslo znovu
      </label>
      <input
        className="mb-6 rounded-md border-gray-200 py-1"
        type="password"
        size={30}
        name="password_again"
        placeholder="••••••••"
        required
      />
      <SubmitButton
        isSubmitting={isSubmitting}
        label="Vytvoriť účet"
        submittingLabel="Vytváram..."
      />
      {errorMess && (
        <Alert variant="destructive" className="mt-2">
          <ExclamationTriangleIcon className="h-4 w-4" />
          {errorMess}
        </Alert>
      )}
    </form>
  );
}
