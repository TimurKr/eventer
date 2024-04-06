"use client";

import Error from "@/components/Error";
import { captureException } from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error);
  }, [error]);
  return (
    <html>
      <body>
        <Error error={error} reset={reset} />
      </body>
    </html>
  );
}
