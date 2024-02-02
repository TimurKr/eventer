import { fetchCoupons } from "./serverActions";
import Coupons from "./clientComponent";

export default async function Page() {
  const fetchedCouponsResponse = await fetchCoupons();

  if (fetchedCouponsResponse.error)
    throw new Error(fetchedCouponsResponse.error.message);

  return <Coupons defaultCoupons={fetchedCouponsResponse.data} />;
}
