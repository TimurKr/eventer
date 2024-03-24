"use client";

import InlineLoading from "@/components/InlineLoading";
import CustomComboBox from "@/components/forms/ComboBox";
import {
  CustomErrorMessage,
  FormikSelectField,
  FormikTextField,
} from "@/components/forms/FormikElements";
import SubmitButton from "@/components/forms/SubmitButton";
import { useRxCollection, useRxData } from "@/rxdb/db";
import { ContactsDocumentType } from "@/rxdb/schemas/public/contacts";
import { CouponsDocument } from "@/rxdb/schemas/public/coupons";
import { TicketTypesDocument } from "@/rxdb/schemas/public/ticket_types";
import {
  TicketsDocument,
  TicketsDocumentType,
} from "@/rxdb/schemas/public/tickets";
import {
  ArrowDownLeftIcon,
  CurrencyEuroIcon,
  InformationCircleIcon,
  PlusCircleIcon,
  SquaresPlusIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Alert, Tooltip } from "flowbite-react";
import { FieldArray, Form, Formik, FormikHelpers, FormikProps } from "formik";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { HiExclamationTriangle } from "react-icons/hi2";
import { toast } from "react-toastify";
import * as Yup from "yup";
import CouponCodeField from "../_modals/CouponCodeField";
import { contactsEqual } from "../utils";

function AddTicketButton({
  type,
  creatingTickets,
  eventId,
  onClick,
}: {
  type: TicketTypesDocument;
  creatingTickets: Pick<TicketsDocument, "type_id">[];
  eventId: string;
  onClick: (
    ticket: Pick<TicketsDocumentType, "type_id" | "price"> &
      Pick<ContactsDocumentType, "name" | "email" | "phone">,
  ) => void;
}) {
  const creating = useMemo(
    () => creatingTickets.filter((t) => t.type_id == type.id).length,
    [creatingTickets, type.id],
  );

  const { result: soldTickets } = useRxData(
    "tickets",
    useCallback(
      (c) =>
        c.find({
          selector: {
            type_id: type.id,
            payment_status: { $ne: "zrušené" },
            event_id: eventId,
          },
        }),
      [eventId, type.id],
    ),
  );

  return (
    <button
      key={type.id}
      type="button"
      className={`flex items-center gap-2 rounded-lg border p-0 px-2 py-1 text-sm ${
        type.capacity && creating > type.capacity - (soldTickets?.length || 0)
          ? "border-red-100 bg-red-100 text-red-600 hover:cursor-default"
          : type.capacity &&
              creating == type.capacity - (soldTickets?.length || 0)
            ? "border-gray-100 bg-gray-50 text-gray-400 hover:cursor-default"
            : "border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
      onClick={() =>
        onClick({
          name: "",
          email: "",
          phone: "",
          type_id: type.id,
          price: type.price,
        })
      }
    >
      {type.is_vip && <CheckBadgeIcon className="h-5 w-5 text-green-500" />}
      <div className="flex flex-col items-start">
        <p className="font-medium">{type.label}</p>
        <div className="text-xs font-light">
          <span className="font-medium">{creating}</span>
          {type.capacity &&
            `/${type.capacity - (soldTickets?.length || 0)} voľných`}
        </div>
      </div>
      <PlusCircleIcon className="h-5 w-5" />
    </button>
  );
}

function TooManySoldAlert({
  type,
  creatingTickets,
  eventId,
}: {
  type: TicketTypesDocument;
  creatingTickets: Pick<TicketsDocument, "type_id">[];
  eventId: string;
}) {
  const { result: soldTickets } = useRxData(
    "tickets",
    useCallback(
      (c) =>
        c.find({
          selector: {
            type_id: type.id,
            payment_status: { $ne: "zrušené" },
            event_id: eventId,
          },
        }),
      [eventId, type.id],
    ),
    { initialResult: [] },
  );

  const afterSaleCount = useMemo(
    () =>
      (soldTickets.length || 0) +
      creatingTickets.filter((t) => t.type_id == type.id).length,
    [creatingTickets, soldTickets, type.id],
  );

  if (type.capacity && afterSaleCount > type.capacity) {
    return (
      <Alert
        color="failure"
        icon={HiExclamationTriangle}
        className="my-2"
        key={type.id}
      >
        Po vytvorení bude {afterSaleCount} lístkov typu{" "}
        <span className="font-semibold">{type.label}</span>, čo je viac ako
        povolených {type.capacity}.
      </Alert>
    );
  }
}

export default function NewTicketsForm({}: {}) {
  const router = useRouter();

  const params = useSearchParams();
  const eventId = params.get("eventId") || "";
  const couponCode = params.get("couponCode") || undefined;
  const contactId = params.get("contactId") || undefined;

  const [coupon, setCoupon] = useState<CouponsDocument | undefined | null>(
    undefined,
  );

  const { result: event, isFetching: isEventFetching } = useRxData(
    "events",
    useCallback((collection) => collection.findOne(eventId), [eventId]),
  );

  const { result: contact } = useRxData(
    "contacts",
    useCallback((c) => c.findOne(contactId || "NOT ID"), [contactId]),
  );

  const { result: ticketTypes, isFetching: isFetchingTicketTypes } = useRxData(
    "ticket_types",
    useCallback(
      (collection) =>
        collection.find({
          selector: { service_id: { $eq: event?.service_id } },
        }),
      [event?.service_id],
    ),
    {
      hold: isEventFetching,
      initialResult: [],
    },
  );

  const { result: allContacts, collection: contactsCollection } = useRxData(
    "contacts",
    useCallback((c) => c.find(), []),
    { initialResult: [] },
  );

  const ticketsCollection = useRxCollection("tickets");
  const couponsCollection = useRxCollection("coupons");

  const validationSchema = useMemo(
    () =>
      Yup.object({
        billingName: Yup.string()
          .min(2, "Zadajte aspoň 2 znaky")
          .required("Meno je povinné"),
        billingEmail: Yup.string().email("Zadajte platný email").default(""),
        billingPhone: Yup.string().default(""),
        paymentStatus: Yup.mixed()
          .oneOf(["zaplatené", "rezervované", "zrušené"])
          .required("Musíte zadať stav platby"),
        tickets: Yup.array()
          .of(
            Yup.object({
              name: Yup.string().min(2, "Zadajte aspoň 2 znaky"),
              email: Yup.string().email("Zadajte platný email"),
              phone: Yup.string(),
              type_id: Yup.string()
                .oneOf(
                  ticketTypes?.map((t) => t.id) || [],
                  "Zadajte platnú možnosť",
                )
                .required("Musíte zadať typ"),
              price: Yup.number().required("Cena je povinná"),
            }),
          )
          .required("Musíte pridať aspoň jeden lístok")
          .min(1, "Musíte pridať aspoň jeden lístok"),
      }),
    [ticketTypes],
  );

  type TicketOrderType = Yup.InferType<typeof validationSchema>;

  const initialValues: TicketOrderType = {
    billingName: contact?.name || "",
    billingEmail: contact?.email || "",
    billingPhone: contact?.phone || "",
    tickets: [],
    paymentStatus: "rezervované",
  };

  const onSubmit = async (
    values: TicketOrderType,
    { setErrors }: FormikHelpers<TicketOrderType>,
  ) => {
    if (!event || !contactsCollection || !ticketsCollection) {
      return;
    }

    let billingContact = await contactsCollection
      .findOne({
        selector: {
          name: values.billingName,
          email: values.billingEmail,
          phone: values.billingPhone,
        },
      })
      .exec();

    if (!billingContact) {
      billingContact = await contactsCollection.insert({
        id: crypto.randomUUID(),
        name: values.billingName,
        email: values.billingEmail,
        phone: values.billingPhone,
      });
    }

    const s = values.tickets.map((ticket) => ({
      name: ticket.name || values.billingName,
      email: ticket.email || values.billingEmail,
      phone: ticket.phone || values.billingPhone,
    }));

    let oldGuestContacts = await contactsCollection
      .find({
        selector: {
          $or: s,
        },
      })
      .exec();

    let insertData: Pick<
      ContactsDocumentType,
      "id" | "name" | "email" | "phone"
    >[] = [];

    values.tickets
      .map((t) => ({
        name: t.name || values.billingName,
        email: t.email || values.billingEmail,
        phone: t.phone || values.billingPhone,
      }))
      .forEach((ticketContact) => {
        if (
          oldGuestContacts.find((contact) =>
            contactsEqual(contact, ticketContact),
          )
        )
          return;
        if (insertData.find((contact) => contactsEqual(contact, ticketContact)))
          return;

        insertData.push({
          ...ticketContact,
          id: crypto.randomUUID(),
        });
      });

    const { success: newGuestContacts } =
      await contactsCollection.bulkInsert(insertData);

    const guestContacts = [...oldGuestContacts, ...newGuestContacts];

    const ticketToCreate = values.tickets.map((ticket) => ({
      id: crypto.randomUUID(),
      billing_id: billingContact!.id,
      guest_id: guestContacts.find((c) =>
        contactsEqual(c, {
          name: ticket.name || values.billingName,
          email: ticket.email || values.billingEmail || "",
          phone: ticket.phone || values.billingPhone,
        }),
      )!.id,
      event_id: event!.id,
      type_id: ticket.type_id,
      price: ticket.price,
      payment_status: values.paymentStatus as string,
      coupon_redeemed_id: coupon?.id,
    }));

    const { success: createdTickets } =
      await ticketsCollection.bulkInsert(ticketToCreate);
    if (coupon) {
      const r = await coupon.incrementalPatch({
        amount:
          coupon.amount -
          Math.min(
            coupon.amount,
            createdTickets.map((t) => t.price).reduce((a, b) => a + b, 0),
          ),
      });
    }

    toast.success("Lístky boli vytvorené", { autoClose: 1500 });
    router.back();
  };

  if (!eventId || (!event && !isEventFetching)) {
    router.back();
    return null;
  }

  if (ticketTypes.length === 0 && !isFetchingTicketTypes) {
    return (
      <div className="flex h-full w-full flex-col items-center gap-2">
        <p>Na zvolenú udalosť neexistujú typy lístkov</p>
        <Link
          href={`/dashboard/services/edit?serviceId=${event?.service_id}`}
          className="rounded-lg bg-gray-100 px-2 py-1 text-center text-sm text-gray-600 hover:bg-gray-200"
        >
          Vytvoriť typ lístkov
        </Link>
      </div>
    );
  }

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({
        values,
        isSubmitting,
        errors,
        getFieldMeta,
        getFieldHelpers,
        setFieldValue,
      }: FormikProps<TicketOrderType>) => (
        <Form>
          <div className="flex items-center gap-1 ps-1 font-bold">
            <span className="me-auto font-bold">Fakturčné údaje</span>
            {contact &&
              (contactsEqual(contact, {
                name: values.billingName,
                email: values.billingEmail,
                phone: values.billingPhone,
              }) ? (
                <>
                  <InformationCircleIcon className="h-4 w-4 " />
                  <span className="text-sm font-light text-gray-600">
                    Automaticky zvolené podľa kontaktu pri poukaze
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm font-normal text-gray-600">
                    <button
                      type="button"
                      className="flex gap-1 text-gray-500 hover:text-gray-700 active:text-gray-800"
                      onClick={() => {
                        setFieldValue("billingName", contact.name, true);
                        setFieldValue("billingEmail", contact.email, true);
                        setFieldValue("billingPhone", contact.phone, true);
                      }}
                    >
                      <ArrowDownLeftIcon className="h-4 w-4" />
                      <UserCircleIcon className="h-4 w-4" />
                      Vyplniť podľa kontaktu pri kupóne
                    </button>
                  </span>
                </>
              ))}
          </div>
          <div className="flex gap-2 rounded-xl border border-gray-400 p-2">
            <CustomComboBox
              options={allContacts.map((c) => {
                const { _attachments, _deleted, _meta, _rev, id, ...data } =
                  c._data;
                return data;
              })}
              defaultValue={{
                name: values.billingName,
                email: values.billingEmail,
                phone: values.billingPhone,
              }}
              displayFun={(c) => c?.name || ""}
              searchKeys={["name"]}
              newValueBuilder={(input) => ({
                name: input,
                email: values.billingEmail || "",
                phone: values.billingPhone || "",
                id: crypto.randomUUID(),
              })}
              onSelect={async (contact) => {
                await setFieldValue("billingName", contact?.name || "", true);
                await setFieldValue("billingEmail", contact?.email || "", true);
                await setFieldValue("billingPhone", contact?.phone || "", true);
              }}
              label="Meno"
              placeholder="Adam Kováč"
              vertical
              iconStart={<UserCircleIcon className="h-4 w-4 text-gray-500" />}
              error={
                <CustomErrorMessage fieldMeta={getFieldMeta("billingName")} />
              }
            />
            <FormikTextField
              name="billingEmail"
              label="Email"
              placeHolder="-"
              optional
              vertical
            />
            <FormikTextField
              name="billingPhone"
              label="Telefón"
              placeHolder="-"
              optional
              vertical
            />
            <FormikSelectField name="paymentStatus" label="Stav" vertical>
              <option value="zaplatené">Zaplatené</option>
              <option value="rezervované">Rezervované</option>
              <option value="zrušené">Zrušené</option>
            </FormikSelectField>
          </div>

          <p className="ps-1 pt-4 font-bold">Lístky</p>
          <div className="rounded-xl border border-gray-400 p-2">
            <FieldArray name="tickets">
              {(ticketsProps) => (
                <>
                  {values.tickets && values.tickets.length > 0 && (
                    <table className="w-full">
                      <thead>
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
                      </thead>
                      <tbody>
                        {values.tickets.map((ticket, index) => (
                          <tr key={index}>
                            <td className="px-1">
                              <CustomComboBox
                                options={allContacts.map((c) => {
                                  const {
                                    _attachments,
                                    _deleted,
                                    _meta,
                                    _rev,
                                    ...data
                                  } = c._data;
                                  return data;
                                })}
                                optional
                                displayFun={(c) => c?.name || ""}
                                searchKeys={["name"]}
                                newValueBuilder={(input) => ({
                                  name: input,
                                  email: values.tickets[index].email || "",
                                  phone: values.tickets[index].phone || "",
                                  id: crypto.randomUUID(),
                                })}
                                onSelect={async (contact) => {
                                  await setFieldValue(
                                    `tickets[${index}].name`,
                                    contact?.name || "",
                                    true,
                                  );
                                  if (contact?.id) {
                                    await setFieldValue(
                                      `tickets[${index}].email`,
                                      contact?.email || "",
                                      true,
                                    );
                                    await setFieldValue(
                                      `tickets[${index}].phone`,
                                      contact?.phone || "",
                                      true,
                                    );
                                  }
                                }}
                                placeholder={values.billingName || "-"}
                                vertical
                                iconStart={
                                  <UserCircleIcon className="h-4 w-4 text-gray-500" />
                                }
                                error={
                                  <CustomErrorMessage
                                    fieldMeta={getFieldMeta("billingName")}
                                  />
                                }
                              />
                            </td>
                            <td className="px-1">
                              <FormikTextField
                                name={`tickets[${index}].email`}
                                placeHolder={values.billingEmail || "-"}
                                optional
                                vertical
                              />
                            </td>
                            <td className="px-1">
                              <FormikTextField
                                name={`tickets[${index}].phone`}
                                placeHolder={values.billingPhone || "-"}
                                optional
                                vertical
                              />
                            </td>
                            <td className="px-1">
                              <FormikSelectField
                                name={`tickets[${index}].type_id`}
                                iconStart={
                                  ticketTypes.find(
                                    (t) => t.id == ticket.type_id,
                                  )?.is_vip && (
                                    <Tooltip content="VIP">
                                      <CheckBadgeIcon className="h-5 w-5 text-green-500" />
                                    </Tooltip>
                                  )
                                }
                                onChange={(v: string) => {
                                  getFieldHelpers(
                                    `tickets[${index}].price`,
                                  ).setValue(
                                    ticketTypes.find((t) => t.id === v)
                                      ?.price || 0,
                                  );
                                }}
                              >
                                {ticketTypes.map((type) => (
                                  <option value={type.id} key={type.id}>
                                    {type.label}
                                  </option>
                                ))}
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
                                type="button"
                                className="self-center p-2 text-red-600 hover:text-red-700"
                                onClick={() => ticketsProps.remove(index)}
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <div className="flex flex-col items-center">
                    {!values.tickets ||
                      (values.tickets.length === 0 && (
                        <p className="pt-3 text-sm text-gray-400">
                          Žiadne lístky
                        </p>
                      ))}
                    <CustomErrorMessage fieldMeta={getFieldMeta("tickets")} />
                  </div>
                  <div className="flex w-full flex-row flex-wrap items-end justify-end gap-2 pt-4">
                    {isFetchingTicketTypes ? (
                      <InlineLoading />
                    ) : (
                      ticketTypes.map((type) => (
                        <AddTicketButton
                          key={type.id}
                          type={type}
                          creatingTickets={values.tickets}
                          eventId={eventId}
                          onClick={ticketsProps.push}
                        />
                      ))
                    )}
                    <button
                      type="button"
                      className="rounded-lg p-2 text-gray-600 transition-all hover:scale-110 hover:text-gray-700"
                      title="Pridať typ lístka"
                      onClick={() => {
                        router.prefetch(
                          `/dashboard/services/edit?serviceId=${event?.service_id}`,
                        );
                        if (
                          !confirm(
                            "Otvoriť typy lístkov? Stratíte zmeny, ktoré ste doteraz vykonali.",
                          )
                        )
                          return;
                        router.push(
                          `/dashboard/services/edit?serviceId=${event?.service_id}`,
                        );
                      }}
                    >
                      <SquaresPlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </FieldArray>
          </div>
          {ticketTypes.map((type) => (
            <TooManySoldAlert
              key={type.id}
              type={type}
              creatingTickets={values.tickets}
              eventId={eventId}
            />
          ))}
          <div className="my-6 flex flex-row items-center gap-4">
            <span className="shrink text-lg font-medium">Rekapitulácia</span>
            <div className="h-px grow bg-gray-300" />
          </div>
          <table className="w-full">
            <tbody>
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
                    couponsCollection={couponsCollection}
                  />
                </td>
                <td className="px-2 text-end">
                  {coupon
                    ? -Math.max(
                        Math.min(
                          coupon.amount,
                          values.tickets.reduce((a, b) => a + b.price, 0),
                        ),
                        0,
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
            </tbody>
          </table>
          <div className="mt-4 flex items-center justify-end gap-4">
            <SubmitButton
              isSubmitting={isSubmitting}
              label="Vytvoriť"
              submittingLabel="Vytváram..."
              className="m-0"
            />
          </div>
        </Form>
      )}
    </Formik>
  );
}
