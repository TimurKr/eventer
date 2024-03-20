"use client";
import DropdownSelector from "@/components/DropdownSelector";
import InlineLoading from "@/components/InlineLoading";
import { SelectContactDialog } from "@/components/SelectContact";
import TextAreaInputDialog from "@/components/TextAreaInputDialog";
import { BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useRxCollection, useRxData } from "@/rxdb/db";
import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import { TicketsDocument } from "@/rxdb/schemas/public/tickets";
import {
  ArrowTopRightOnSquareIcon,
  PencilIcon,
  PlusCircleIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";

function ContactInTicket({
  className,
  contact,
  replaceOnlyHere,
  replaceWholeGroup,
}: {
  className?: string;
  contact: ContactsDocument;
  replaceOnlyHere: (newContact: ContactsDocument) => void;
  replaceWholeGroup: (newContact: ContactsDocument) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { contactId: currentContactId } = useParams<{ contactId?: string }>();

  return (
    <DropdownMenu
      modal={false}
      open={dropdownOpen}
      onOpenChange={setDropdownOpen}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant={"link"}
          className={cn(
            currentContactId != contact.id && "!text-black",
            className,
          )}
        >
          {contact.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild disabled={!contact.id}>
          <Link href={`/dashboard/contacts/${contact?.id}`}>
            <PencilIcon className="me-2 h-4 w-4" />
            Upraviť kontakt
          </Link>
        </DropdownMenuItem>
        <SelectContactDialog
          onSelected={(c) => replaceOnlyHere(c)}
          onClosed={() => setDropdownOpen(false)}
        >
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <UserIcon className="me-2 h-4 w-4" />
            Vybrať iný kontakt pre 1 lístok
          </DropdownMenuItem>
        </SelectContactDialog>
        <SelectContactDialog
          onSelected={(c) => replaceWholeGroup(c)}
          onClosed={() => setDropdownOpen(false)}
        >
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <UserGroupIcon className="me-2 h-4 w-4" />
            Vybrať iný kontakt pre celú skupin
          </DropdownMenuItem>
        </SelectContactDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function TicketRow({
  ticket,
  disableArrived = false,
  selectCheckbox,
  index,
  highlight,
}: {
  ticket: TicketsDocument;
  disableArrived?: boolean;
  selectCheckbox?: Pick<
    Parameters<typeof Checkbox>[0],
    "checked" | "onCheckedChange"
  >;
  index: number;
  highlight?: boolean;
}) {
  const { result: guest } = useRxData(
    "contacts",
    useCallback((c) => c.findOne(ticket.guest_id), [ticket.guest_id]),
  );
  const { result: billing } = useRxData(
    "contacts",
    useCallback((c) => c.findOne(ticket.billing_id), [ticket.billing_id]),
  );

  const { result: event } = useRxData(
    "events",
    useCallback((c) => c.findOne(ticket.event_id), [ticket.event_id]),
  );

  const { result: ticketTypes } = useRxData(
    "ticket_types",
    useCallback(
      (c) => c.find({ selector: { service_id: event?.service_id } }),
      [event],
    ),
    { initialResult: [], hold: !event },
  );

  const ticketsCollection = useRxCollection("tickets");

  return (
    <TableRow
      data-state={
        highlight ? "highlighted" : selectCheckbox?.checked ? "selected" : ""
      }
    >
      <TableCell className="whitespace-nowrap">
        {index}
        {selectCheckbox && <Checkbox className="ms-2" {...selectCheckbox} />}
      </TableCell>
      <TableCell>
        <DropdownSelector
          label="Zmeniť typ"
          onChange={(v) => {
            if (
              !confirm(
                "Naozaj chcete zmeniť typ lístka? Zmení sa s ním aj cena.",
              )
            )
              return;
            const newTicketType = ticketTypes?.find((type) => type.id === v);
            if (!newTicketType) return console.error("Ticket type not found");
            ticket.incrementalPatch({
              type_id: v,
              price: newTicketType?.price,
            });
          }}
          value={ticket?.type_id}
          options={ticketTypes.reduce<
            Record<string, { display?: string; variant: BadgeProps["variant"] }>
          >(
            (optionsObject, ticketType) => ({
              ...optionsObject,
              [ticketType.id]: {
                variant: ticketType.is_vip ? "default" : "outline",
                display: ticketType.label,
              },
            }),
            {},
          )}
        />
      </TableCell>
      <TableCell className="text-center">
        {!guest ? (
          <InlineLoading />
        ) : (
          <ContactInTicket
            contact={guest}
            replaceOnlyHere={(newContact) =>
              ticket.incrementalPatch({ guest_id: newContact.id })
            }
            replaceWholeGroup={async (newContact) => {
              if (!ticketsCollection) {
                console.error("No tickets collection");
                return;
              }
              const tickets = await ticketsCollection
                .find({
                  selector: {
                    event_id: ticket.event_id,
                    guest_id: ticket.guest_id,
                  },
                })
                .exec();
              const r = await ticketsCollection.bulkUpsert(
                tickets.map((t) => ({ ...t._data, guest_id: newContact.id })),
              );
              r.error.forEach((e) =>
                toast.error("Chyba pri zmene kontaktu. Kód: " + e.status),
              );
            }}
          />
        )}
      </TableCell>
      <TableCell className="text-center">
        {!billing ? (
          <InlineLoading />
        ) : (
          <ContactInTicket
            contact={billing}
            replaceOnlyHere={(newContact) =>
              ticket.incrementalPatch({ billing_id: newContact.id })
            }
            replaceWholeGroup={async (newContact) => {
              if (!ticketsCollection) {
                console.error("No tickets collection");
                return;
              }
              const tickets = await ticketsCollection
                .find({
                  selector: {
                    event_id: ticket.event_id,
                    billing_id: ticket.billing_id,
                  },
                })
                .exec();
              const r = await ticketsCollection.bulkUpsert(
                tickets.map((t) => ({ ...t._data, billing_id: newContact.id })),
              );
              r.error.forEach((e) =>
                toast.error("Chyba pri zmene kontaktu. Kód: " + e.status),
              );
            }}
          />
        )}
      </TableCell>
      <TableCell>
        <DropdownSelector
          label="Zmeniť status"
          onChange={(v) => ticket.incrementalPatch({ payment_status: v })}
          value={ticket?.payment_status}
          options={{
            zaplatené: { variant: "default" },
            zrušené: { variant: "destructive" },
            rezervované: { variant: "outline" },
          }}
        />
      </TableCell>
      <TableCell>
        <Checkbox
          checked={ticket.arrived}
          disabled={disableArrived}
          onCheckedChange={() =>
            ticket.incrementalPatch({ arrived: !ticket.arrived })
          }
        />
      </TableCell>
      <TableCell className="text-end">
        <TextAreaInputDialog
          title="Poznámka ku lístku"
          defaultValue={ticket.note}
          onSave={(note) => ticket.incrementalPatch({ note })}
        >
          <button className="max-w-40 truncate text-end underline-offset-4 hover:underline">
            {ticket.note || (
              <PlusCircleIcon className="h-4 transition-all hover:scale-110" />
            )}
          </button>
        </TextAreaInputDialog>
      </TableCell>
      <TableCell className="whitespace-nowrap text-end">
        {ticket.price} €
      </TableCell>
      <TableCell className="text-end">
        <Link
          href={`/dashboard/events?query=${ticket.id}`}
          className="transition-colors hover:text-blue-500"
        >
          <ArrowTopRightOnSquareIcon className="h-4" />
        </Link>
      </TableCell>
    </TableRow>
  );
}
