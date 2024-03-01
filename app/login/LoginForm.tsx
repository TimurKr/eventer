"use client";

import { Alert } from "flowbite-react";
import { useState, useTransition } from "react";
import { HiExclamationCircle } from "react-icons/hi2";
import { SubmitButton } from "../../utils/forms/FormElements_dep";

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
        className="mb-6 rounded-md border-gray-200 py-1"
        type="password"
        size={30}
        name="password"
        placeholder="••••••••"
        required
      />
      <SubmitButton
        isSubmitting={isSubmitting}
        label="Prihlásiť"
        submittingLabel="Prihlasujem..."
      />
      {errorMess && (
        <Alert color="failure" icon={HiExclamationCircle} className="mt-2">
          {errorMess}
        </Alert>
      )}
    </form>
  );
}
