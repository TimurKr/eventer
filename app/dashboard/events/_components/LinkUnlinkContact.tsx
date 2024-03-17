"use client";

import { useRxData } from "@/rxdb/db";
import { TicketsDocument } from "@/rxdb/schemas/public/tickets";
import { Tooltip } from "flowbite-react";
import { useCallback, useMemo } from "react";
import { LiaUnlinkSolid } from "react-icons/lia";

export default function LinkUnlinkContact({
  groupSize,
  ticket,
  type,
}: {
  groupSize: number;
  ticket: TicketsDocument;
  type: "guest_id" | "billing_id";
}) {
  // const {
  //   events: { contacts, refresh },
  //   contact,
  // } = useStoreContext((state) => ({
  //   ...state,
  //   contact: state.events.contacts.find((c) => c.id == ticket[type])!,
  // }));

  const { result: contact, collection: contactsCollection } = useRxData(
    "contacts",
    useCallback(
      (collection) => collection.findOne(ticket[type]),
      [ticket, type],
    ),
  );

  const { result: tickets } = useRxData(
    "tickets",
    useCallback(
      (collection) =>
        collection.find({
          selector: {
            $or: [{ guest_id: ticket[type] }, { billing_id: ticket[type] }],
          },
        }),
      [ticket, type],
    ),
    { hold: !contact, initialResult: [] },
  );

  const usage_count = useMemo(() => {
    if (!contact || !tickets) return 0;
    let count = 0;
    tickets.forEach((t) => {
      if (t.guest_id === contact.id) count++;
      if (t.billing_id === contact.id) count++;
    });
    return count;
  }, [tickets, contact]);

  if (!contact || !contactsCollection || usage_count < 2) return null;
  if (usage_count < 2) return null;
  if (groupSize < 2 && type !== "guest_id") return null;
  return (
    <div className="inline-flex">
      <div
        className={`inline-block p-1 ${
          type === "guest_id" ? "invisible group-hover:visible" : ""
        }`}
      >
        <Tooltip
          content={`Tento kontakt sa používa na ${
            usage_count - 1
          } iných miestach. Kliknutím sem ${
            type === "guest_id"
              ? "zrušíte tento link a umožníte zmeny iba na tomto mieste."
              : "oddelíte jeden lístok z tejto skupiny."
          }`}
        >
          <button
            onClick={async () => {
              const {
                _data: {
                  id,
                  created_at,
                  _attachments,
                  _meta,
                  _deleted,
                  _rev,
                  ...contactData
                },
              } = contact;
              let name = contactData.name + ` (kópia ${1})`;
              for (let i = 2; true; i++) {
                if (
                  !(await contactsCollection
                    .findOne({
                      selector: { name: { $eq: name } },
                    })
                    .exec())
                )
                  break;
                name = contactData.name + ` (kópia ${i})`;
              }
              const newContact = await contactsCollection.insert({
                ...contactData,
                name,
                id: crypto.randomUUID(),
              });
              if (
                ticket.guest_id === ticket.billing_id &&
                type === "billing_id"
              ) {
                await ticket.incrementalPatch({
                  guest_id: newContact.id,
                  billing_id: newContact.id,
                });
              } else {
                await ticket.incrementalPatch({ [type]: newContact.id });
              }
            }}
          >
            <LiaUnlinkSolid
              className={`inline h-4 w-4 hover:scale-105 hover:text-red-500 active:scale-110 active:text-red-700`}
            />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
