import { Id, toast } from "react-toastify";

export async function optimisticUpdate<T, K extends keyof T>({
  value,
  localUpdate,
  databaseUpdate,
  localRevert,
  onSuccessfulUpdate,
  confirmation,
  loadingMessage,
  errorPrefix,
  errorMessageOverride,
  successMessage,
  hideToast,
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
  if (!hideToast) toastId = toast.loading(loadingMessage || "Ukladám...");
  localUpdate(value);
  const res = await databaseUpdate(value);
  if (res?.error) {
    localRevert();
    if (toastId)
      toast.update(toastId, {
        render: `${errorPrefix || "Chyba: "}: ${
          errorMessageOverride || res.error.message
        }`,
        type: "error",
        isLoading: false,
        closeButton: true,
      });
    else
      toast.error(
        `${errorPrefix || "Chyba: "}: ${
          errorMessageOverride || res.error.message
        }`,
        {
          autoClose: false,
          closeButton: true,
        },
      );
  } else {
    await onSuccessfulUpdate?.();
    if (toastId)
      toast.update(toastId, {
        render: successMessage || "Uložené!",
        type: "success",
        isLoading: false,
        autoClose: 1500,
      });
  }
}
