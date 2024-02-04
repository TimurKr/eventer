import { toast } from "react-toastify";

export async function optimisticUpdate<T, K extends keyof T>({
  value,
  localUpdate,
  databaseUpdate,
  onFailRefresh,
  confirmation,
  loadingMessage,
  errorPrefix,
  errorMessageOverride,
  successMessage,
}: {
  value: Partial<T> & { [P in K]: T[K] };
  localUpdate: (value: Partial<T> & { [P in K]: T[K] }) => void;
  databaseUpdate: (value: Partial<T> & { [P in K]: T[K] }) => Promise<any>;
  onFailRefresh: () => void;
  confirmation?: string;
  loadingMessage?: string;
  errorPrefix?: string;
  errorMessageOverride?: string;
  successMessage?: string;
}) {
  if (confirmation && !confirm(confirmation)) return;
  const toastId = toast.loading(loadingMessage || "Ukladám...");
  localUpdate(value);
  const res = await databaseUpdate(value);
  if (res.error) {
    toast.update(toastId, {
      render: `${errorPrefix || "Chyba: "}: ${
        errorMessageOverride || res.error.message
      }`,
      type: "error",
      isLoading: false,
      closeButton: true,
    });
    onFailRefresh();
  } else {
    toast.update(toastId, {
      render: successMessage || "Uložené!",
      type: "success",
      isLoading: false,
      autoClose: 1500,
    });
  }
}
