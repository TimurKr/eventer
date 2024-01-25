"use client";

import {
  CustomErrorMessage,
  GenericTextField,
  SubmitButton,
} from "@/app/components/FormElements";
import { Contacts, Events } from "@/utils/supabase/database.types";
import { Alert, Button, Modal } from "flowbite-react";
import {
  Field,
  FieldArray,
  Form,
  Formik,
  FormikHelpers,
  FormikProps,
} from "formik";
import { useContext, useEffect, useState } from "react";
import * as Yup from "yup";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { TrashIcon } from "@heroicons/react/24/solid";
import {
  EventWithTickets,
  bulkCreateTickets,
  bulkInsertContacts,
  fetchContacts,
} from "./serverActions";
import { HiExclamationTriangle } from "react-icons/hi2";
import { toast } from "react-toastify";
import { EventsContext } from "./zustand";
import { useStore } from "zustand";
import { contactsEqual } from "./utils";

export default function NewTicketModal({ eventId }: { eventId: Events["id"] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [contacts, setContacts] = useState<Contacts[]>([]);

  const store = useContext(EventsContext);
  if (!store) throw new Error("Missing BearContext.Provider in the tree");
  const ticketTypes = useStore(store, (state) =>
    state.ticketTypes.map((t) => ({
      ...t,
      sold: state.events
        .find((e) => e.id === eventId)!
        .tickets.filter((ticket) => ticket.type == t.label).length,
    })),
  );
  const addTickets = useStore(store, (state) => state.addTickets);

  useEffect(() => {
    (async () => {
      const { data: contacts, error } = await fetchContacts();
      if (error) {
        throw error;
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

    const { data: createdTickets, error } = await bulkCreateTickets(
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
      })),
    );
    if (error) {
      setErrors({ tickets: "Chyba pri vytváraní lístkov: " + error });
      return;
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
        onClick={() => setIsOpen(true)}
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
                  <GenericTextField
                    name="billingName"
                    label="Meno"
                    placeHolder="Adam Kováč"
                    vertical
                  />
                  <GenericTextField
                    // type="email"
                    name="billingEmail"
                    label="Email"
                    placeHolder="adam.kovac@gmail.com"
                    optional
                    vertical
                  />
                  <GenericTextField
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
                    <Field
                      name="paymentStatus"
                      as="select"
                      className=" rounded-lg border-none py-1 shadow-md"
                    >
                      <option value="zaplatené">Zaplatené</option>
                      <option value="rezervované">Rezervované</option>
                      <option value="zrušené">Zrušené</option>
                    </Field>
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
                        <table className="">
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
                            <th className="px-2 text-end text-sm font-normal text-gray-500">
                              Typ
                            </th>
                            <th className="px-2 text-end text-sm font-normal text-gray-500">
                              Cena
                            </th>
                            <th></th>
                          </tr>
                          {values.tickets.map((ticket, index) => (
                            // <div className="flex flex-row items-center gap-2 rounded-xl bg-slate-200 p-2 shadow-md">
                            <tr>
                              <td className="px-1">
                                <GenericTextField
                                  name={`tickets[${index}].name`}
                                  placeHolder={
                                    values.billingName || "Adam Kováč"
                                  }
                                  optional
                                  vertical
                                />
                              </td>
                              <td className="px-1">
                                <GenericTextField
                                  name={`tickets[${index}].email`}
                                  placeHolder="-"
                                  optional
                                  vertical
                                />
                              </td>
                              <td className="px-1">
                                <GenericTextField
                                  name={`tickets[${index}].phone`}
                                  placeHolder="-"
                                  optional
                                  vertical
                                />
                              </td>
                              <td className="px-1">
                                <Field
                                  name={`tickets[${index}].type`}
                                  as="select"
                                  className=" rounded-lg border-none py-1 shadow-md"
                                >
                                  <option value="standard">Standard</option>
                                  <option value="VIP">VIP</option>
                                </Field>
                              </td>
                              <td className="px-1">
                                <Field
                                  name={`tickets[${index}].price`}
                                  type="number"
                                  className="w-16 rounded-md border-none p-1 text-right shadow-md"
                                />
                                {/* {getFieldMeta(`tickets[${index}].price`) &&
                                  getFieldMeta(`tickets[${index}].price`)
                                    .touched &&
                                  getFieldMeta(`tickets[${index}].price`)
                                    .error && (
                                    <CustomErrorMessage
                                      message={
                                        getFieldMeta(`tickets[${index}].price`)
                                          .error
                                      }
                                    />
                                  )} */}
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
                            // </div>
                          ))}
                          <tr>
                            <td colSpan={4}></td>
                            <td className="pt-2 text-end font-bold">
                              <hr />
                              {values.tickets
                                .map((t) => t.price)
                                .reduce((a, b) => a + b, 0)}{" "}
                              €
                            </td>
                            <td></td>
                          </tr>
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

                <div className="flex justify-end">
                  <SubmitButton isSubmitting={isSubmitting} />
                </div>
              </Form>
            )}
          </Formik>
        </Modal.Body>
      </Modal>
    </>
  );
}
