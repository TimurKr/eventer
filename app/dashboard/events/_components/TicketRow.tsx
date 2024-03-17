"use client";

import {
  InstantSwitchField,
  InstantTextAreaField,
  InstantTextField,
} from "@/components/forms/InstantFields";
import { useRxCollection, useRxData } from "@/rxdb/db";
import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import { TicketsDocument } from "@/rxdb/schemas/public/tickets";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/solid";
import { Checkbox, Dropdown, Table } from "flowbite-react";
import { useCallback, useMemo } from "react";
import { HiTrash } from "react-icons/hi2";
import { number as yupNumber, string as yupString } from "yup";
import CouponRelationManager from "../_modals/CouponRelationManager";
import LinkUnlinkContact from "./LinkUnlinkContact";

const ticketStatuses = ["rezervované", "zaplatené", "zrušené"];

export default function TicketRow({
  ticket,
  eventTickets,
  selectedTickets,
  toggleSelectedTicket,
  highlightedTickets,
  lockedArrived,
}: {
  ticket: TicketsDocument;
  eventTickets: TicketsDocument[];
  selectedTickets: TicketsDocument[];
  toggleSelectedTicket: (ticket: TicketsDocument) => void;
  highlightedTickets?: TicketsDocument[];
  lockedArrived: boolean;
}) {
  const indexInEvent = useMemo(
    () => eventTickets.findIndex((t) => t.id === ticket.id),
    [ticket.id, eventTickets],
  );
  const groupSize = useMemo(
    () => eventTickets.filter((t) => t.billing_id === ticket.billing_id).length,
    [ticket.billing_id, eventTickets],
  );
  const groupTickets = useMemo(
    () => eventTickets.filter((t) => t.billing_id === ticket.billing_id),
    [ticket.billing_id, eventTickets],
  );
  const indexInGroup = useMemo(
    () => groupTickets.indexOf(ticket),
    [groupTickets, ticket],
  );

  const isSelected = useMemo(
    () => !!selectedTickets.find((st) => st.id === ticket.id),
    [selectedTickets, ticket],
  );
  const isHighlighted = useMemo(
    () => !!highlightedTickets?.find((ht) => ht.id === ticket.id),
    [highlightedTickets, ticket],
  );

  const ticketsCollection = useRxCollection("tickets");
  const couponsCollection = useRxCollection("coupons");

  //TODO: Create a nice hook for findOne with populate
  const { result: billingContact, collection: contactsCollection } = useRxData(
    "contacts",
    useCallback(
      (collection) => collection.findOne(ticket.billing_id),
      [ticket.billing_id],
    ),
  );
  const { result: guestContact } = useRxData(
    "contacts",
    useCallback(
      (collection) => collection.findOne(ticket.guest_id),
      [ticket.guest_id],
    ),
  );
  const { result: event } = useRxData(
    "events",
    useCallback(
      (collection) => collection.findOne(ticket.event_id),
      [ticket.event_id],
    ),
  );

  const { result: ticketTypes, collection: ticketTypesCollection } = useRxData(
    "ticket_types",
    useCallback(
      (collection) =>
        collection.find({ selector: { service_id: event?.service_id } }),
      [event?.service_id],
    ),
  );
  const { result: ticketType } = useRxData(
    "ticket_types",
    useCallback(
      (collection) => collection.findOne(ticket.type_id),
      [ticket.type_id],
    ),
  );

  const updateContactField = useCallback(
    async (
      contact: ContactsDocument | null | undefined,
      field: "name" | "phone" | "email",
      value: string,
    ) => {
      if (!ticketsCollection || !contactsCollection || !couponsCollection) {
        console.error("Collections not found");
        return;
      }
      if (!contact) {
        console.error("No contact provided not found");
        return;
      }
      const existingContact = await contactsCollection
        .findOne({
          selector: {
            $and: [
              { name: { $eq: field === "name" ? value : contact?.name } },
              { phone: { $eq: field === "phone" ? value : contact?.phone } },
              { email: { $eq: field === "email" ? value : contact?.email } },
            ],
          },
        })
        .exec();
      if (!existingContact) {
        return await contact?.incrementalPatch({ [field]: value || "" });
      }
      if (
        !confirm("Takýto kontakt už v databáze máte, táto operácia ich spojí.")
      )
        return;
      // MERGING CONTACTS
      // remove all mentions of the old contact as guest, billing and coupon
      const guestMentions = await ticketsCollection
        .find({ selector: { guest_id: contact?.id || "NOT ID" } })
        .exec();
      const billingMentions = await ticketsCollection
        .find({ selector: { billing_id: contact?.id || "NOT ID" } })
        .exec();
      const couponMentions = await couponsCollection
        .find({ selector: { contact_id: contact?.id || "NOT ID" } })
        .exec();

      const guestPromises = guestMentions.map((t) =>
        t.incrementalPatch({ guest_id: existingContact.id }),
      );
      const billingPromises = billingMentions.map((t) =>
        t.incrementalPatch({ billing_id: existingContact.id }),
      );
      const couponPromises = couponMentions.map((c) =>
        c.incrementalPatch({ contact_id: existingContact.id }),
      );
      await Promise.all([
        ...guestPromises,
        ...billingPromises,
        ...couponPromises,
      ]);
      // remove the old contact
      await contact?.remove();
    },
    [contactsCollection, couponsCollection, ticketsCollection],
  );

  return (
    <Table.Row
      key={ticket.id}
      id={"ticket-" + ticket.id}
      className={`${
        ticket.payment_status != "zrušené"
          ? isHighlighted
            ? "bg-yellow-200"
            : highlightedTickets
              ? "bg-gray-200"
              : "bg-white"
          : isHighlighted
            ? "bg-orange-300"
            : highlightedTickets
              ? "bg-red-50"
              : "bg-red-100"
      }`}
    >
      <Table.Cell
        className={`whitespace-nowrap p-0 pl-2 ${
          indexInGroup == 0 && "rounded-tl-md"
        } ${indexInGroup == groupSize - 1 && "rounded-bl-md"}`}
      >
        {ticket.payment_status != "zrušené" && (
          <Checkbox
            className="me-2"
            checked={isSelected}
            onChange={() => toggleSelectedTicket(ticket)}
          />
        )}
        {indexInEvent} - <span className="text-xs">{indexInGroup + 1}</span>
      </Table.Cell>
      <Table.Cell className="p-2 py-0">
        <select
          value={ticketType?.id}
          className={`rounded-md border-none px-2 py-0.5 text-xs font-semibold hover:cursor-pointer ${
            ticketType?.is_vip
              ? "bg-emerald-400 text-black"
              : "bg-gray-200 text-gray-600"
          }`}
          onChange={(e) => {
            if (
              !confirm(
                "Naozaj chcete zmeniť typ lístka? Zmení sa s ním aj cena.",
              )
            )
              return;
            const newTicketType = ticketTypes?.find(
              (type) => type.id === e.target.value,
            );
            if (!newTicketType) return console.error("Ticket type not found");
            ticket.incrementalPatch({
              type_id: e.target.value,
              price: newTicketType?.price,
            });
          }}
        >
          {ticketTypes?.map((type) => (
            <option key={type.label} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </Table.Cell>
      <Table.Cell className="group text-pretty border-l p-0">
        <InstantTextField
          defaultValue={guestContact?.name || ""}
          type="text"
          inline
          trim
          placeholder="Meno"
          validate={async (value) =>
            value == "" ? "Meno nesmie byť prázdne" : null
          }
          updateValue={(value) =>
            updateContactField(guestContact, "name", value || "")
          }
        />
        <InstantTextField
          defaultValue={guestContact?.phone || ""}
          type="text"
          inline
          trim
          placeholder="Telefón"
          updateValue={(value) =>
            updateContactField(guestContact, "phone", value || "")
          }
        />
        <div className="inline-block">
          <InstantTextField
            defaultValue={guestContact?.email || ""}
            type="email"
            inline
            trim
            placeholder="Email"
            validate={(value) =>
              yupString()
                .email("Zadajte platný email")
                .validate(value)
                .then(() => null)
                .catch((err) => err.message)
            }
            updateValue={(value) =>
              updateContactField(guestContact, "email", value || "")
            }
          />
          <LinkUnlinkContact
            groupSize={groupSize}
            ticket={ticket}
            type="guest_id"
          />
        </div>
      </Table.Cell>
      {indexInGroup == 0 && (
        <Table.Cell
          className={`group border-x p-1 ${
            ticket.payment_status != "zrušené"
              ? highlightedTickets
                ? "bg-gray-200"
                : "bg-white"
              : highlightedTickets
                ? "bg-red-50"
                : "bg-red-100"
          }`}
          rowSpan={groupSize}
        >
          <div className="flex flex-col">
            <div className="flex">
              <div className="grow">
                <InstantTextField
                  defaultValue={billingContact?.name || ""}
                  type="text"
                  trim
                  inline
                  placeholder="Meno"
                  className="grow"
                  validate={async (value) =>
                    value == "" ? "Meno nesmie byť prázdne" : null
                  }
                  updateValue={(value) =>
                    updateContactField(billingContact, "name", value || "")
                  }
                />
              </div>
              <LinkUnlinkContact
                groupSize={groupSize}
                ticket={ticket}
                type="billing_id"
              />
            </div>
            <InstantTextField
              defaultValue={billingContact?.phone || ""}
              type="text"
              trim
              inline
              placeholder="Telefón"
              updateValue={(value) =>
                updateContactField(billingContact, "phone", value || "")
              }
              className="font-mono"
            />
            <InstantTextField
              defaultValue={billingContact?.email || ""}
              type="email"
              trim
              inline
              placeholder="Email"
              validate={(value) =>
                yupString()
                  .email("Zadajte platný email")
                  .validate(value)
                  .then(() => null)
                  .catch((err) => err.message)
              }
              updateValue={(value) =>
                updateContactField(billingContact, "email", value || "")
              }
            />
          </div>
        </Table.Cell>
      )}
      <Table.Cell className="px-auto py-0">
        {ticket.payment_status != "zrušené" && (
          <InstantSwitchField
            disabled={lockedArrived}
            defaultValue={ticket.arrived!}
            updateValue={(value) => ticket.incrementalPatch({ arrived: value })}
          />
        )}
      </Table.Cell>
      <Table.Cell className="p-1 text-end">
        <select
          className={`border-1 rounded-md border-none px-2 py-0.5 text-xs font-semibold hover:cursor-pointer ${
            ticket.payment_status === "rezervované"
              ? "bg-yellow-300 text-yellow-600"
              : ticket.payment_status === "zaplatené"
                ? "bg-green-200 text-green-600"
                : ticket.payment_status === "zrušené"
                  ? "bg-red-200 text-gray-500"
                  : ""
          }`}
          onChange={async (e) => {
            let ticketsToUpdate = groupTickets.filter(
              (t) => t.payment_status == ticket.payment_status,
            );
            if (
              ticketsToUpdate.length > 1 &&
              !confirm(
                `Prajete si zmeniť status všetkých lístkov v tejto skupine s aktuálnym statusom ${ticket.payment_status}? (${ticketsToUpdate.length} lístkov)`,
              )
            )
              ticketsToUpdate = [ticket];

            ticketsToUpdate.forEach((t) =>
              t.incrementalPatch({ payment_status: e.target.value }),
            );
          }}
          value={ticket.payment_status}
        >
          {ticketStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </Table.Cell>
      <Table.Cell className="relative w-36 overflow-clip p-1 text-end has-[:focus]:overflow-visible has-[:hover]:overflow-visible">
        <InstantTextAreaField
          autoexpand
          className="absolute inset-y-auto end-0 w-full -translate-y-1/2 transition-all duration-300 ease-in-out hover:w-64 focus:w-64"
          defaultValue={ticket.note || ""}
          placeholder="Poznámka"
          updateValue={(value) =>
            ticket.incrementalPatch({ note: value || undefined })
          }
        />
      </Table.Cell>
      <Table.Cell className="whitespace-nowrap px-1 py-0 text-end">
        <div className="flex flex-col justify-center py-1">
          <CouponRelationManager ticket={ticket} type={"redeemed"} />
          <CouponRelationManager ticket={ticket} type={"created"} />
        </div>
      </Table.Cell>
      <Table.Cell className="whitespace-nowrap px-1 py-0 text-end">
        <InstantTextField
          type="text"
          defaultValue={ticket.price.toString()}
          placeholder="Cena"
          inline={true}
          className="me-0"
          validate={async (value) => {
            return yupNumber()
              .required("Zadajte cenu")
              .validate(value || undefined)
              .then(() => null)
              .catch((err) => err.message);
          }}
          updateValue={(value) =>
            ticket.incrementalPatch({
              price: value ? parseFloat(value) : undefined,
            })
          }
        />{" "}
        €
      </Table.Cell>
      <Table.Cell
        className={`whitespace-nowrap p-1 ${
          indexInGroup == 0 && "rounded-tr-md"
        } ${indexInGroup == groupSize - 1 && "rounded-br-md"}`}
      >
        <Dropdown
          label=""
          dismissOnClick={false}
          renderTrigger={() => (
            <EllipsisHorizontalIcon className="h-5 w-5 rounded-md border border-gray-200 bg-gray-50 text-gray-700 hover:cursor-pointer hover:bg-gray-200" />
          )}
        >
          <Dropdown.Item
            className="text-red-500"
            icon={HiTrash}
            onClick={() => {
              if (
                !confirm(
                  "Naozaj chcete vymazať tento lístok? Zvážte iba zmenu statusu na zrušené.",
                )
              )
                return;
              ticket.remove();
            }}
          >
            Vymazať
          </Dropdown.Item>
        </Dropdown>
      </Table.Cell>
    </Table.Row>
  );
}
