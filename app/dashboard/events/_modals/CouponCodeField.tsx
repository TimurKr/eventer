import {
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
  useTransition,
} from "react";
import { Spinner } from "flowbite-react";
import { Coupons } from "@/utils/supabase/database.types";

export default function CouponCodeField({
  coupon,
  setCoupon,
  validate,
  defaultCode,
}: {
  coupon: Coupons | null | undefined;
  setCoupon: Dispatch<SetStateAction<Coupons | null | undefined>>;
  validate: (code: string) => Promise<Coupons | null | undefined>;
  defaultCode?: string;
}) {
  const [code, setCode] = useState("");
  const [isValidating, startValidatingCoupon] = useTransition();

  useEffect(() => {
    if (defaultCode) {
      setCode(defaultCode);
      startValidatingCoupon(async () => {
        const coupon = await validate(defaultCode);
        setCoupon(coupon);
      });
    }
  }, []);

  return (
    <div className="relative me-auto w-40">
      <input
        type="text"
        className={`w-full rounded-lg border-gray-200 bg-gray-50 px-2 py-1 font-mono ${
          coupon === null
            ? "border-red-500 text-red-500"
            : coupon === undefined
              ? ""
              : "border-green-500 text-green-500"
        }`}
        placeholder="Poukaz"
        value={code}
        onChange={(e) => {
          const newCode = e.target.value.toUpperCase().trim();
          if (newCode.length > 8 || isValidating) return;
          setCode(newCode);
          setCoupon(undefined);
          if (newCode.length < 8) return;
          startValidatingCoupon(async () => {
            const coupon = await validate(newCode);
            setCoupon(coupon);
            if (coupon) e.target.blur();
          });
        }}
      />
      {isValidating ? (
        <div className="absolute inset-y-0 end-2 grid place-content-center">
          <Spinner />
        </div>
      ) : coupon ? (
        <div className="absolute inset-y-0 end-2 grid place-content-center">
          <div className="rounded-md bg-green-500 px-2 py-0.5 font-mono text-xs text-white">
            {coupon.amount} €
          </div>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-y-0 end-2 grid place-content-center font-mono text-xs text-gray-500">
          {code.length}/8
        </div>
      )}
    </div>
  );
}
