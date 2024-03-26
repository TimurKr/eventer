"use client";

import SubmitButton from "@/components/forms/SubmitButton";
import { useRxCollection, useRxData } from "@/rxdb/db";
import { CouponsDocument } from "@/rxdb/schemas/public/coupons";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  UseFormReturn,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { z } from "zod";
import CouponCodeField from "../_modals/CouponCodeField";

import InlineLoading from "@/components/InlineLoading";
import { SelectContactDialog } from "@/components/SelectContact";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { FormTextField } from "@/components/ui/form-text-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TicketTypesDocument } from "@/rxdb/schemas/public/ticket_types";
import {
  ArrowDownLeftIcon,
  ArrowPathIcon,
  CurrencyEuroIcon,
  InformationCircleIcon,
  PlusCircleIcon,
  SquaresPlusIcon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { toast } from "react-toastify";
import { AddTicketButton, TooManySoldAlert } from "./components";

// Define form schema
const formSchema = z.object({
  contact: z.string().uuid("Musíte vybrať kontakt"),
  paymentStatus: z.enum(["zaplatené", "rezervované", "zrušené"]),
  tickets: z
    .object({
      contact: z.string().uuid("Musíte vybrať kontakt"),
      type_id: z.string().uuid("Musíte vybrať type lístka"),
      price: z.number({
        invalid_type_error: "Zadajte valídnu cenu",
        required_error: "Cena je povinná",
      }),
    })
    .array()
    .nonempty("Musíte pridať aspoň jeden lístok"),
});

type Values = z.infer<typeof formSchema>;

function FormTicketRow({
  form,
  index,
  remove,
  ticketTypes,
}: {
  form: UseFormReturn<Values>;
  index: number;
  remove: () => void;
  ticketTypes: TicketTypesDocument[];
}) {
  const contactId = useWatch({
    control: form.control,
    name: `tickets.${index}.contact`,
  });

  const { result: contact, isFetching: isFetchingContact } = useRxData(
    "contacts",
    useCallback((c) => c.findOne(contactId), [contactId]),
  );

  return (
    <tr>
      <td className="px-1">
        <SelectContactDialog
          onSelected={(c) => form.setValue(`tickets.${index}.contact`, c.id)}
          description="Zvolte kontakt ktorý sa priradí k lístku"
        >
          <Button
            variant={"link"}
            className={cn(
              !isFetchingContact &&
                contact?.id === form.getValues("contact") &&
                "text-gray-600",
              contact === null && "text-red-600",
            )}
          >
            {contact ? (
              <>
                {contact?.name}
                <ArrowPathIcon className="ms-2 h-4 w-4" />
              </>
            ) : (
              <>
                <PlusCircleIcon className="me-2 h-4 w-4" />
                Pridať kontakt
              </>
            )}
          </Button>
        </SelectContactDialog>
        <FormField
          control={form.control}
          name={`tickets.${index}.contact`}
          render={() => <FormMessage className="ps-2" />}
        />
      </td>
      <td className="w-px">
        <FormField
          control={form.control}
          name={`tickets.${index}.type_id`}
          render={({ field }) => (
            <FormItem>
              <Select
                onValueChange={(v) => {
                  field.onChange(v);
                  const ticketType = ticketTypes.find((tt) => tt.id === v);
                  if (ticketType) {
                    form.setValue(`tickets.${index}.price`, ticketType.price);
                    toast.info(
                      `Cena lístka bola nastavená na ${ticketType.price}€`,
                      { autoClose: 1500 },
                    );
                  }
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Zvolte typ lístka" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ticketTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        {type.is_vip && (
                          <CheckBadgeIcon className="h-4 w-4 text-green-500" />
                        )}
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </td>
      <td className="w-px">
        <div className="flex w-full justify-end">
          <FormTextField
            form={form}
            name={`tickets.${index}.price`}
            type="number"
            icons={{ start: <CurrencyEuroIcon className="h-4 w-4" /> }}
            baseClassName="w-32"
          />
        </div>
      </td>
      <td className="w-px">
        <button
          type="button"
          className="self-center p-2 text-red-600 hover:text-red-700"
          onClick={remove}
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
}

export default function NewTicketsForm({}: {}) {
  const router = useRouter();

  // Get params
  const params = {
    eventId: useSearchParams().get("eventId") || "",
    contactId: useSearchParams().get("contactId") || undefined,
    couponCode: useSearchParams().get("couponCode") || undefined,
  };

  // Set up state
  const [coupon, setCoupon] = useState<CouponsDocument | undefined | null>(
    undefined,
  );

  // Fetch data
  const { result: event, isFetching: isFetchingEvent } = useRxData(
    "events",
    useCallback(
      (collection) => collection.findOne(params.eventId),
      [params.eventId],
    ),
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
      hold: isFetchingEvent,
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

  const form = useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contact: params.contactId || "",
      paymentStatus: "rezervované",
      tickets: [],
    },
  });

  const billingContactId = useWatch({
    name: "contact",
    control: form.control,
  });
  const { result: contact } = useRxData(
    "contacts",
    useCallback(
      (c) => c.findOne(billingContactId || "NOT ID"),
      [billingContactId],
    ),
  );

  const ticketsArray = useFieldArray({
    name: "tickets",
    control: form.control,
  });

  const handleSubmit = async (values: Values) => {
    console.log(values);
    if (!event || !contactsCollection || !ticketsCollection) {
      return;
    }

    const ticketToCreate = values.tickets.map((ticket) => ({
      id: crypto.randomUUID(),
      event_id: event!.id,
      billing_id: values.contact,
      guest_id: ticket.contact,
      type_id: ticket.type_id,
      price: ticket.price,
      payment_status: values.paymentStatus as string,
      coupon_redeemed_id: coupon?.id,
    }));

    const { success: createdTickets, error } =
      await ticketsCollection.bulkInsert(ticketToCreate);
    if (coupon) {
      try {
        await coupon.incrementalPatch({
          amount:
            coupon.amount -
            Math.min(
              coupon.amount,
              createdTickets.map((t) => t.price).reduce((a, b) => a + b, 0),
            ),
        });
      } catch (e) {
        console.error(e);
        toast.error(
          "Nepodarilo sa znížiť hodnotu poukazu, prosím upravte ho manuálne",
        );
      }
    }
    if (error.length) {
      if (error.length === ticketToCreate.values.length) {
        toast.error("Nepodarilo sa vytvoriť žiadne lístky");
      } else {
        error.forEach((e) => {
          console.error(e);
          toast.error("Nepodarilo sa vytvoriť lístok");
        });
      }
      return;
    }

    toast.success("Lístky boli vytvorené", { autoClose: 1500 });
    router.back();
  };

  if (!params.eventId || (!event && !isFetchingEvent)) {
    router.back();
    return null;
  }

  if (ticketTypes.length === 0 && !isFetchingTicketTypes) {
    return (
      <div className="flex h-full w-full flex-col items-center gap-2 text-sm text-gray-700">
        <p>Na zvolenú udalosť neexistujú typy lístkov</p>
        <Button variant={"outline"} asChild>
          <Link
            href={`/dashboard/services/edit?serviceId=${event?.service_id}`}
            // className="rounded-lg bg-gray-100 px-2 py-1 text-center text-sm text-gray-600 hover:bg-gray-200"
          >
            Vytvoriť nový typ lístkov
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <Form form={form} onSubmit={handleSubmit} className="min-w-96">
      <div className="flex items-center gap-1 ps-1 font-bold">
        <span className="me-auto font-bold">Fakturčné údaje</span>
        <div>
          {params.contactId &&
            (params.contactId === contact?.id ? (
              <p className="flex items-center justify-end gap-1 text-sm font-light text-gray-600 animate-in">
                <InformationCircleIcon className="h-4 w-4 " />
                Automaticky vyplnené
              </p>
            ) : (
              <button
                type="button"
                className="flex items-center gap-1 text-sm font-light text-gray-500 animate-in hover:text-gray-600 active:text-gray-700"
                onClick={() => {
                  // @ts-expect-error Typescript doesn't know params.contactId is defined in this branch
                  form.setValue("contact", params.contactId, {
                    shouldValidate: true,
                  });
                }}
              >
                <ArrowDownLeftIcon className="h-4 w-4" />
                <UserCircleIcon className="h-4 w-4" />
                Vrátiť na originál
              </button>
            ))}
          {coupon?.contact_id &&
            (coupon.contact_id === contact?.id ? (
              <p className="flex items-center justify-end gap-1 text-sm font-light text-gray-600 animate-in">
                <InformationCircleIcon className="h-4 w-4 " />
                Automaticky vyplnené podľa poukazu
              </p>
            ) : (
              <button
                type="button"
                className="flex items-center gap-1 text-sm font-light text-gray-500 animate-in hover:text-gray-600 active:text-gray-700"
                onClick={() => {
                  // @ts-expect-error Typescript doesn't know coupon.contact_id is defined in this branch
                  form.setValue("contact", coupon.contact_id, {
                    shouldValidate: true,
                  });
                }}
              >
                <ArrowDownLeftIcon className="h-4 w-4" />
                <UserCircleIcon className="h-4 w-4" />
                Vyplniť automaticky podľa poukazu
              </button>
            ))}
        </div>
      </div>
      <div className="flex justify-between gap-2 rounded-xl border border-gray-400 p-2">
        <div>
          <SelectContactDialog
            onSelected={(c) => {
              form.setValue("contact", c.id, { shouldValidate: true });
              form.getValues("tickets").forEach((ticket, index, array) => {
                ticket.contact ||
                  form.setValue(`tickets.${index}.contact`, c.id, {
                    shouldValidate: true,
                  });
              });
            }}
            description="Zvolte fakturačný kontakt alebo vytvorte nový."
          >
            <Button
              variant={"link"}
              className={cn(!contact?.id && "text-red-600")}
            >
              {contact ? (
                <>
                  {contact?.name}
                  <ArrowPathIcon className="ms-2 h-4 w-4" />
                </>
              ) : (
                <>
                  <PlusCircleIcon className="me-2 h-4 w-4" />
                  Pridať kontakt
                </>
              )}
            </Button>
          </SelectContactDialog>
          <FormField
            control={form.control}
            name="contact"
            render={() => <FormMessage className="ps-2" />}
          />
        </div>
        {contact && (
          <div className="me-auto self-center">
            {contact.email && (
              <p className="pl-4 text-xs font-light text-gray-600">
                Email: {contact?.email}
              </p>
            )}
            {contact.phone && (
              <p className="pl-4 text-xs font-light text-gray-600">
                Telefón: {contact?.phone}
              </p>
            )}
          </div>
        )}
        <FormField
          control={form.control}
          name="paymentStatus"
          render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Zvoľte status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="rezervované" className="flex justify-end">
                    <div className="rounded bg-amber-200 px-2 py-0.5 font-medium text-amber-700">
                      Rezervované
                    </div>
                  </SelectItem>
                  <SelectItem value="zaplatené" className="flex justify-end">
                    <div className="rounded bg-green-200 px-2 py-0.5 font-medium text-green-800">
                      Zaplatené
                    </div>
                  </SelectItem>
                  <SelectItem value="zrušené" className="flex justify-end">
                    <div className="rounded bg-red-200 px-2 py-0.5 font-medium text-red-700 ">
                      Zrušené
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <p className="ps-1 pt-4 font-bold">Lístky</p>
      <div className="rounded-xl border border-gray-400 p-2">
        {ticketsArray.fields && ticketsArray.fields.length > 0 && (
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-2 text-start text-sm font-normal text-gray-500">
                  Meno
                </th>
                <th className="px-2 text-end text-sm font-normal text-gray-500">
                  Typ
                </th>
                <th className="px-2 text-end text-sm font-normal text-gray-500">
                  Cena
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ticketsArray.fields.map((ticket, index) => (
                <FormTicketRow
                  key={ticket.id}
                  form={form}
                  index={index}
                  remove={() => ticketsArray.remove(index)}
                  ticketTypes={ticketTypes}
                />
              ))}
            </tbody>
          </table>
        )}
        <div className="flex flex-col items-center">
          {!form.getValues("tickets") ||
            (form.getValues("tickets").length === 0 && (
              <p className="pt-3 text-sm text-gray-400">Žiadne lístky</p>
            ))}
          <FormField
            control={form.control}
            name="tickets"
            render={() => <FormMessage />}
          />
        </div>
        <div className="flex w-full flex-row flex-wrap items-end justify-end gap-2 pt-4">
          {isFetchingTicketTypes ? (
            <InlineLoading />
          ) : (
            ticketTypes.map((type) => (
              <AddTicketButton
                key={type.id}
                type={type}
                alreadyCreatedTickets={form.getValues("tickets")}
                eventId={params.eventId}
                onClick={() =>
                  ticketsArray.append({
                    contact: form.getValues("contact"),
                    type_id: type.id,
                    price: type.price,
                  })
                }
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
      </div>
      {ticketTypes.map((type) => (
        <TooManySoldAlert
          key={type.id}
          type={type}
          creatingTickets={form.getValues("tickets")}
          eventId={params.eventId}
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
              {form.getValues("tickets").reduce((a, b) => a + b.price, 0)} €
            </td>
          </tr>
          <tr>
            <td className="py-2 pe-6 ps-2">
              <CouponCodeField
                defaultCode={params.couponCode}
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
                      form
                        .getValues("tickets")
                        .reduce((a, b) => a + b.price, 0),
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
                form.getValues("tickets").reduce((a, b) => a + b.price, 0) -
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
          isSubmitting={form.formState.isSubmitting}
          label="Vytvoriť"
          submittingLabel="Vytváram..."
          className="m-0"
        />
      </div>
    </Form>
  );
}
