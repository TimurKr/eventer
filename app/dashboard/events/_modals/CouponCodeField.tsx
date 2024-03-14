import {
  CouponsCollection,
  CouponsDocument,
} from "@/rxdb/schemas/public/coupons";
import { Spinner } from "flowbite-react";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import { validateCoupon } from "../../coupons/utils";

/**
 * Renders a coupon code input field.
 */
export default function CouponCodeField({
  coupon,
  setCoupon,
  // validate,
  defaultCode,
  couponsCollection,
}: {
  /**
   * The coupon document. Null if invalid, undefined if not validated yet.
   */
  coupon: CouponsDocument | null | undefined;
  /**
   * The function to set the coupon document. Well set it to null if invalid,
   * undefined if not validated yet.
   */
  setCoupon: Dispatch<SetStateAction<CouponsDocument | null | undefined>>;
  /**
   * The function to validate the coupon code. Shuold return the coupon if valid,
   * null if invalid, undefined if not validated yet.
   */
  // validate: (code: string) => Promise<CouponsDocument | null | undefined>;
  defaultCode?: string;
  couponsCollection: CouponsCollection | null;
}) {
  const [code, setCode] = useState("");
  const [isValidating, startValidatingCoupon] = useTransition();

  const validate = useCallback(
    async (code: string) => {
      if (!couponsCollection) {
        console.log("No collection...");
        return undefined;
      }
      const coupon = await couponsCollection
        .findOne({ selector: { code } })
        .exec();
      if (coupon && validateCoupon(coupon)) {
        return coupon;
      }
      return null;
    },
    [couponsCollection],
  );

  useEffect(() => {
    if (defaultCode) {
      setCode(defaultCode);
      startValidatingCoupon(async () => {
        const coupon = await validate(defaultCode);
        setCoupon(coupon);
      });
    }
  }, [defaultCode, setCoupon, validate]);

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
