import { Id, toast } from "react-toastify";

/**
 * Performs an optimistic update by updating the local state first and then updating the database.
 * If the database update fails, the local state is reverted.
 *
 * @template T - The type of the object being updated.
 * @template K - The id key of the object.
 * @param options - The options for the optimistic update.
 * @param options.value - The updated value, use `{}` if youe specify local update.
 * @param options.localUpdate - The function to update the local state. Expects either value, with required ID key, or nothing, if value {}.
 * @param options.databaseUpdate - The function to update the database. Expects either value, with required ID key, or nothing, if value {}.
 * @param options.localRevert - The function to revert the local state. Expects no arguments.
 * @param options.onSuccessfulUpdate - The function to execute after a successful update.
 * @param options.confirmation - Optional confirmation message before performing the update.
 * @param options.loadingMessage - Optional loading message to display during the update.
 * @param options.errorPrefix - Optional prefix for the error message.
 * @param options.errorMessageOverride - Optional override for the error message.
 * @param options.successMessage - Optional success message to display after a successful update.
 * @param options.hideToast - Whether to hide the toast message during the update.
 * @returns - A promise that resolves when the update is complete.
 */
export async function optimisticUpdate<T, K extends keyof T>({
  value,
  localUpdate,
  databaseUpdate,
  localRevert,
  onSuccessfulUpdate,
  confirmation,
  loadingMessage = "Ukladám...",
  errorPrefix = "Chyba: ",
  errorMessageOverride,
  successMessage = "Uložené!",
  hideToast = false,
}: {
  value: Partial<T> & { [P in K]: T[K] };
  localUpdate: (value: Partial<T> & { [P in K]: T[K] }) => void;
  databaseUpdate: (value: Partial<T> & { [P in K]: T[K] }) => Promise<any>;
  localRevert: () => void;
  onSuccessfulUpdate?: () => Promise<any>;
  confirmation?: string;
  loadingMessage?: string;
  errorPrefix?: string;
  errorMessageOverride?: string;
  successMessage?: string;
  hideToast?: boolean;
}) {
  if (confirmation && !confirm(confirmation)) return;
  let toastId: Id | null = null;
  if (!hideToast) toastId = toast.loading(loadingMessage);
  localUpdate(value);
  const res = await databaseUpdate(value);
  if (res?.error) {
    localRevert();
    if (toastId)
      toast.update(toastId, {
        render: `${errorPrefix}: ${errorMessageOverride || res.error.message}`,
        type: "error",
        isLoading: false,
        closeButton: true,
      });
    else
      toast.error(
        `${errorPrefix}: ${errorMessageOverride || res.error.message}`,
        {
          autoClose: false,
          closeButton: true,
        },
      );
  } else {
    await onSuccessfulUpdate?.();
    if (toastId)
      toast.update(toastId, {
        render: successMessage,
        type: "success",
        isLoading: false,
        autoClose: 1500,
      });
  }
}

function fun({ a = "a", b }: { a?: string; b: number }): string {
  return a + b.toString();
}

fun({ b: 1 });
