import { logOutServer } from "./serverActions";

export function logOutClient(clearStorage?: () => void) {
  if (clearStorage) {
    try {
      clearStorage();
    } catch (error) {
      console.error(error);
    }
  }
  logOutServer();
}
