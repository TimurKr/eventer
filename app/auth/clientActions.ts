import { useStoreContext } from "../dashboard/store";
import { logOutServer } from "./serverActions";

export function logOutClient(clearStorage: () => void) {
  try {
    clearStorage();
  } catch (error) {
    console.error(error);
  }
  logOutServer();
}
