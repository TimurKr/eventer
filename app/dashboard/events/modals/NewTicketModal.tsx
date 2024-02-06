"use client";

import {
  CustomErrorMessage,
  FormikSelectField,
  FormikTextField,
  SubmitButton,
} from "@/app/components/FormElements";
import { Contacts, Coupons, Events } from "@/utils/supabase/database.types";
import { Alert, Button, Modal, Spinner } from "flowbite-react";
import { FieldArray, Form, Formik, FormikHelpers, FormikProps } from "formik";
import { useContext, useEffect, useState, useTransition } from "react";
import * as Yup from "yup";
import { CurrencyEuroIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { TrashIcon } from "@heroicons/react/24/solid";
import {
  bulkInsertTickets,
  bulkInsertContacts,
  fetchContacts,
  validateCouponCode,
  redeemCoupon,
} from "../serverActions";
import { HiExclamationTriangle } from "react-icons/hi2";
import { toast } from "react-toastify";
import { useStore } from "zustand";
import { contactsEqual } from "../utils";
import CouponCodeField from "./CouponCodeField";
import { DashboardContext } from "../../zustand";

export default function NewTicketModal({
  eventId,
  onOpen,
  couponCode,
}: {
  eventId: Events["id"];
  onOpen?: () => void;
  couponCode?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [contacts, setContacts] = useState<Contacts[]>([]);
  const [errorMess, setErrorMess] = useState<string | undefined>();
  const [coupon, setCoupon] = useState<Coupons | undefined | null>(undefined);

  const store = useContext(DashboardContext);
  if (!store) throw new Error("Missing BearContext.Provider in the tree");
  const ticketTypes = useStore(store, (state) =>
    state.events.ticketTypes.map((t) => ({
      ...t,
      sold: state.events.events
        .find((e) => e.id === eventId)!
        .tickets.filter((ticket) => ticket.type == t.label).length,
    })),
  );
  const addTickets = useStore(store, (state) => state.events.addTickets);

  useEffect(() => {
    (async () => {
      const { data: contacts, error } = await fetchContacts();
      if (error) {
        setErrorMess(error.message);
        return;
      }
      setContacts(contacts);
    })();
  }, []);

  const validationSchema = Yup.object({
    billingName: Yup.string()
      .min(2, "Zadajte aspoň 2 znaky")
      .required("Meno je povinné"),
    billingEmail: Yup.string().email("Zadajte platný email").optional(),
    billingPhone: Yup.string().optional(),
    paymentStatus: Yup.mixed()
      .oneOf(["zaplatené", "rezervované", "zrušené"])
      .required("Musíte zadať stav platby"),
    tickets: Yup.array()
      .of(
        Yup.object({
          name: Yup.string().min(2, "Zadajte aspoň 2 znaky").optional(),
          email: Yup.string().email("Zadajte platný email").optional(),
          phone: Yup.string().optional(),
          type: Yup.mixed()
            .oneOf(["VIP", "standard"], "Zadajte platnú možnosť")
            .required("Musíte zadať typ"),
          price: Yup.number().required("Cena je povinná"),
        }),
      )
      .required("Musíte pridať aspoň jeden lístok")
      .min(1, "Musíte pridať aspoň jeden lístok"),
  });

  type TicketOrderType = Yup.InferType<typeof validationSchema>;

  const initialValues: TicketOrderType = {
    tickets: [{ type: "standard", price: 80 }],
    paymentStatus: "rezervované",
  } as unknown as TicketOrderType;

  const onSubmit = async (
    values: TicketOrderType,
    { setErrors }: FormikHelpers<TicketOrderType>,
  ) => {
    let allContacts = [...contacts];
    let billingContact = contacts.find((c) =>
      contactsEqual(c, {
        name: values.billingName,
        email: values.billingEmail || null,
        phone: values.billingPhone || null,
      }),
    );
    if (!billingContact) {
      const { data: billingContacts, error: billingError } =
        await bulkInsertContacts([
          {
            name: values.billingName,
            email: values.billingEmail || null,
            phone: values.billingPhone || null,
          },
        ]);
      if (billingError) {
        setErrors({
          tickets: "Chyba pri vytváraní fakturačného kontaktu: " + billingError,
        });
        return;
      }
      billingContact = billingContacts[0];
      allContacts = [...contacts, ...billingContacts];
    }
    const { data: guestContacts, error: guestsError } =
      await bulkInsertContacts(
        values.tickets
          .map(
            (ticket) =>
              ({
                name: ticket.name || values.billingName,
                email: ticket.email || null,
                phone: ticket.phone || null,
              }) as Contacts,
          )
          // filter out existing contacts
          .filter(
            (contact) => ![...contacts].find((c) => contactsEqual(c, contact)),
          )
          // filter out duplicates
          .filter(
            (ticket, i, a) =>
              i === a.findIndex((t) => contactsEqual(t, ticket)),
          ),
      );
    if (guestsError) {
      setErrors({ tickets: "Chyba pri vytváraní kontaktov: " + guestsError });
      return;
    }
    allContacts = [...allContacts, ...guestContacts];

    const { data: createdTickets, error } = await bulkInsertTickets(
      values.tickets.map((ticket) => ({
        billing_id: billingContact!.id,
        guest_id: allContacts.find((c) =>
          contactsEqual(c, {
            name: ticket.name || values.billingName,
            email: ticket.email || null,
            phone: ticket.phone || null,
          }),
        )!.id,
        event_id: eventId,
        type: ticket.type as string,
        price: ticket.price,
        payment_status: values.paymentStatus as string,
        coupon_redeemed_id: coupon?.id || null,
      })),
    );
    if (error) {
      setErrors({ tickets: "Chyba pri vytváraní lístkov: " + error });
      return;
    }
    if (coupon) {
      const couponAmountUpdate = await redeemCoupon(
        coupon.id,
        coupon.amount -
          Math.min(
            coupon.amount,
            createdTickets.map((t) => t.price).reduce((a, b) => a + b, 0),
          ),
      );
      if (couponAmountUpdate.error) {
        setErrors({
          tickets: "Chyba pri aplikovaní kupónu: " + couponAmountUpdate.error,
        });
        return;
      }
    }
    addTickets(
      eventId,
      createdTickets.map((t) => ({
        ...t,
        billing: allContacts.find((c) => c.id == t.billing_id)!,
        guest: allContacts.find((c) => c.id == t.guest_id)!,
      })),
    );
    toast.success("Lístky boli vytvorené");
    setIsOpen(false);
  };

  return (
    <>
      <button
        className="rounded-md bg-green-500 px-2 py-0.5 text-xs text-white hover:bg-green-600"
        onClick={() => {
          onOpen?.();
          setIsOpen(true);
        }}
      >
        Vytvoriť lístok
      </button>
      <Modal
        show={isOpen}
        onClose={() => setIsOpen(false)}
        title="Nový lístok"
        dismissible
        size={"5xl"}
      >
        <Modal.Header>Nový lístok</Modal.Header>
        <Modal.Body>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
          >
            {({
              values,
              isSubmitting,
              errors,
              getFieldMeta,
            }: FormikProps<TicketOrderType>) => (
              <Form>
                <p className="ps-1 font-bold text-slate-700">Fakturčné údaje</p>
                <div className="flex gap-2 rounded-xl bg-slate-200 p-2 shadow-md">
                  <FormikTextField
                    name="billingName"
                    label="Meno"
                    placeHolder="Adam Kováč"
                    vertical
                  />
                  <FormikTextField
                    // type="email"
                    name="billingEmail"
                    label="Email"
                    placeHolder="adam.kovac@gmail.com"
                    optional
                    vertical
                  />
                  <FormikTextField
                    name="billingPhone"
                    label="Telefón"
                    placeHolder="0900 123 456"
                    optional
                    vertical
                  />
                  <div className="flex-0">
                    <label
                      className="p-1 text-gray-700"
                      htmlFor="paymentStatus"
                    >
                      Stav platby
                    </label>
                    <FormikSelectField name="paymentStatus">
                      <option value="zaplatené">Zaplatené</option>
                      <option value="rezervované">Rezervované</option>
                      <option value="zrušené">Zrušené</option>
                    </FormikSelectField>
                    <CustomErrorMessage
                      fieldMeta={getFieldMeta("paymentStatus")}
                    />
                  </div>
                </div>
                <FieldArray name="tickets">
                  {(ticketsProps) => (
                    <>
                      <div className="flex flex-row items-end gap-2 p-1 pt-4">
                        <p className="ps-1 font-bold text-slate-700">Lístky</p>
                        <Button
                          size="xs"
                          className="ms-auto p-0 ps-1"
                          pill
                          onClick={() =>
                            ticketsProps.push({
                              type: "standard",
                              price: ticketTypes.find(
                                (t) => t.label == "standard",
                              )!.price,
                            })
                          }
                        >
                          {
                            values.tickets.filter((t) => t.type == "standard")
                              .length
                          }
                          x Standard
                          <PlusCircleIcon className="ms-2 h-5 w-5" />
                        </Button>
                        <Button
                          size="xs"
                          className="p-0 ps-1"
                          pill
                          onClick={() =>
                            ticketsProps.push({
                              type: "VIP",
                              price: ticketTypes.find((t) => t.label == "VIP")!
                                .price,
                            })
                          }
                        >
                          {values.tickets.filter((t) => t.type == "VIP").length}
                          x VIP
                          <PlusCircleIcon className="ms-2 h-5 w-5" />
                        </Button>
                      </div>
                      {values.tickets && values.tickets.length > 0 ? (
                        <table className="w-full">
                          <tr>
                            <th className="px-2 text-start text-sm font-normal text-gray-500">
                              Meno
                            </th>
                            <th className="px-2 text-start text-sm font-normal text-gray-500">
                              Email
                            </th>
                            <th className="px-2 text-start text-sm font-normal text-gray-500">
                              Telefón
                            </th>
                            <th className="px-2 text-start text-sm font-normal text-gray-500">
                              Typ
                            </th>
                            <th className="px-2 text-start text-sm font-normal text-gray-500">
                              Cena
                            </th>
                            <th></th>
                          </tr>
                          {values.tickets.map((ticket, index) => (
                            // <div className="flex flex-row items-center gap-2 rounded-xl bg-slate-200 p-2 shadow-md">
                            <tr>
                              <td className="px-1">
                                <FormikTextField
                                  name={`tickets[${index}].name`}
                                  placeHolder={
                                    values.billingName || "Adam Kováč"
                                  }
                                  optional
                                  vertical
                                />
                              </td>
                              <td className="px-1">
                                <FormikTextField
                                  name={`tickets[${index}].email`}
                                  placeHolder="-"
                                  optional
                                  vertical
                                />
                              </td>
                              <td className="px-1">
                                <FormikTextField
                                  name={`tickets[${index}].phone`}
                                  placeHolder="-"
                                  optional
                                  vertical
                                />
                              </td>
                              <td className="px-1">
                                <FormikSelectField
                                  name={`tickets[${index}].type`}
                                >
                                  <option value="standard">Standard</option>
                                  <option value="VIP">VIP</option>
                                </FormikSelectField>
                              </td>
                              <td className="px-1">
                                <FormikTextField
                                  name={`tickets[${index}].price`}
                                  type="number"
                                  vertical
                                  iconEnd={
                                    <CurrencyEuroIcon className="pointer-events-none h-4 w-4" />
                                  }
                                />
                              </td>
                              <td>
                                <button
                                  className="self-center p-2 text-red-600 hover:text-red-700"
                                  onClick={() => ticketsProps.remove(index)}
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </table>
                      ) : (
                        "Žiadne lístky"
                      )}
                      <CustomErrorMessage fieldMeta={getFieldMeta("tickets")} />
                    </>
                  )}
                </FieldArray>
                {ticketTypes.map((type) => {
                  const afterSaleCount =
                    type.sold +
                    values.tickets.filter((t) => t.type == type.label).length;
                  if (afterSaleCount > type.max_sold) {
                    return (
                      <Alert color="warning" icon={HiExclamationTriangle}>
                        Po vytvorení bude {afterSaleCount} lístkov typu{" "}
                        <span className="font-semibold">{type.label}</span>, čo
                        je viac ako povolených {type.max_sold}.
                      </Alert>
                    );
                  }
                })}
                <div className="my-6 flex flex-row items-center gap-4">
                  <span className="shrink text-lg font-medium">
                    Rekapitulácia
                  </span>
                  <div className="h-px grow bg-gray-300" />
                </div>
                <table className="w-full">
                  <tr>
                    <td className="pe-6 ps-2">Lístky</td>
                    <td className="px-2 text-end">
                      {values.tickets.reduce((a, b) => a + b.price, 0)} €
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pe-6 ps-2">
                      <CouponCodeField
                        defaultCode={couponCode}
                        coupon={coupon}
                        setCoupon={setCoupon}
                        validate={async (code) => validateCouponCode(code)}
                      />
                    </td>
                    <td className="px-2 text-end">
                      {coupon
                        ? -Math.min(
                            coupon.amount,
                            values.tickets.reduce((a, b) => a + b.price, 0),
                          )
                        : 0}{" "}
                      €
                    </td>
                  </tr>
                  <tr className="border-t font-bold">
                    <td className="px-2">Spolu</td>
                    <td className="px-2 text-end">
                      {Math.max(
                        values.tickets.reduce((a, b) => a + b.price, 0) -
                          (coupon ? coupon.amount : 0),
                        0,
                      )}{" "}
                      €
                    </td>
                  </tr>
                </table>
                <div className="mt-4 flex items-center justify-end gap-4">
                  <SubmitButton
                    isSubmitting={isSubmitting}
                    label="Vytvoriť"
                    submittingLabel="Vytváram..."
                    className="m-0"
                  />
                </div>
                {errorMess && (
                  <Alert color="failure" icon={HiExclamationTriangle}>
                    {errorMess}
                  </Alert>
                )}
              </Form>
            )}
          </Formik>
        </Modal.Body>
      </Modal>
    </>
  );
}
