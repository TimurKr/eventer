"use client";

import InlineLoading from "@/components/InlineLoading";
import NoResults from "@/components/NoResults";
import { SelectContactDialog } from "@/components/SelectContact";
import { InstantTextField } from "@/components/forms/InstantFields";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useRxCollection, useRxData } from "@/rxdb/db";
import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import { EventsDocument } from "@/rxdb/schemas/public/events";
import { TicketsDocument } from "@/rxdb/schemas/public/tickets";
import {
  ArrowTopRightOnSquareIcon,
  PencilIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/solid";
import moment from "moment";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { string as yupString } from "yup";

function DropdownSelector<
  T extends Record<
    string,
    { display?: string; variant: BadgeProps["variant"] }
  >,
>({
  value,
  onChange,
  options,
  label,
}: {
  value?: string;
  onChange: (newStatus: string) => void;
  options: T;
  label: string;
}) {
  if (!value) return <InlineLoading />;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Badge variant={options[value]?.variant || "outline"}>
          {options[value]?.display || value}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => onChange(v)}
        >
          {Object.entries(options).map(([key, value]) => (
            <DropdownMenuRadioItem key={key} value={key}>
              <Badge
                variant={
                  (value as { variant: BadgeProps["variant"] })["variant"]
                }
              >
                {(value as { display?: string }).display || key}
              </Badge>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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

  const { id: currentContactId } = useParams<{ id?: string }>();

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
            currentContactId === contact.id && "text-orange-400 font-medium",
            className,
          )}
        >
          {contact.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild disabled={!contact.id}>
          <Link href={`/dashboard/contacts/${contact?.id}`}>
            <PencilIcon className="h-4 w-4 me-2" />
            Upraviť kontakt
          </Link>
        </DropdownMenuItem>
        <SelectContactDialog
          onSelected={(c) => replaceOnlyHere(c)}
          onClosed={() => setDropdownOpen(false)}
        >
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <UserIcon className="h-4 w-4 me-2" />
            Vybrať iný kontakt pre 1 lístok
          </DropdownMenuItem>
        </SelectContactDialog>
        <SelectContactDialog
          onSelected={(c) => replaceWholeGroup(c)}
          onClosed={() => setDropdownOpen(false)}
        >
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <UserGroupIcon className="h-4 w-4 me-2" />
            Vybrať iný kontakt pre celú skupin
          </DropdownMenuItem>
        </SelectContactDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TicketRow({
  ticket,
  showArrived = true,
  disableArrived = false,
}: {
  ticket: TicketsDocument;
  showArrived?: boolean;
  disableArrived?: boolean;
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
    <TableRow>
      {showArrived && (
        <TableCell>
          <Checkbox
            checked={ticket.arrived}
            disabled={disableArrived}
            onCheckedChange={() =>
              ticket.incrementalPatch({ arrived: !ticket.arrived })
            }
          />
        </TableCell>
      )}
      <TableCell>
        <DropdownSelector
          label="Zmeniť typ"
          onChange={(v) => ticket.incrementalPatch({ type_id: v })}
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

      <TableCell className="text-end">{ticket.note || "-"}</TableCell>
      <TableCell className="text-end">{ticket.price} €</TableCell>
      <TableCell className="text-end">
        <Link
          href={`/dashboard/events?search=${ticket.id}`}
          className="hover:text-blue-500 transition-colors"
        >
          <ArrowTopRightOnSquareIcon className="h-4" />
        </Link>
      </TableCell>
    </TableRow>
  );
}

function Event({
  event,
  tickets,
}: {
  event: EventsDocument;
  tickets: TicketsDocument[];
}) {
  const { result: service } = useRxData(
    "services",
    useCallback((c) => c.findOne(event.service_id), [event.service_id]),
  );
  const [lockedArrived, setLockedArrived] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{service?.name || <InlineLoading />}</CardTitle>
        <CardDescription className="text-xs flex gap-2 items-center text-gray-500">
          <span className="font-medium">
            {new Date(event.datetime).toLocaleString("sk-SK")}
          </span>
          -<span>{moment(event.datetime).fromNow()}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {moment(event.datetime).startOf("day").isBefore(moment()) && (
                <TableHead className="flex items-center gap-1">
                  Dorazil
                  <button
                    type="button"
                    onClick={() => setLockedArrived(!lockedArrived)}
                  >
                    {lockedArrived ? (
                      <LockClosedIcon className="h-3" />
                    ) : (
                      <LockOpenIcon className="h-3" />
                    )}
                  </button>
                </TableHead>
              )}
              <TableHead>Typ lístka</TableHead>
              <TableHead className="text-center">Hosť</TableHead>
              <TableHead className="text-center">Platca</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Poznámka</TableHead>
              <TableHead className="text-end">Cena</TableHead>
              <TableHead className="sr-only"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket, i) => (
              <TicketRow
                key={i}
                ticket={ticket}
                showArrived={moment(event.datetime)
                  .startOf("day")
                  .isBefore(moment())}
                disableArrived={lockedArrived}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function ContactDetail({ id }: { id: ContactsDocument["id"] }) {
  const { result: contact } = useRxData(
    "contacts",
    useCallback((c) => c.findOne(id), [id]),
  );

  const { result: tickets, isFetching: fetchingTickets } = useRxData(
    "tickets",
    useCallback(
      (c) =>
        c.find({ selector: { $or: [{ guest_id: id }, { billing_id: id }] } }),
      [id],
    ),
    { initialResult: [] },
  );

  const { result: events, isFetching: fetchingEvents } = useRxData(
    "events",
    useCallback(
      (c) =>
        c.find({
          selector: { id: { $in: tickets.map((t) => t.event_id) } },
          sort: [{ datetime: "desc" }],
        }),
      [tickets],
    ),
    { hold: fetchingTickets, initialResult: [] },
  );

  const { result: services } = useRxData(
    "services",
    useCallback(
      (c) =>
        c.find({
          selector: { id: { $in: events.map((e) => e.service_id) } },
        }),
      [events],
    ),
    { initialResult: [], hold: fetchingEvents },
  );

  const groupedTickets = useMemo(
    () =>
      events
        .filter((v, i, a) => a.findIndex((v2) => v.id === v2.id) === i)
        .map((e) => ({
          event: e,
          tickets: tickets.filter((t) => t.event_id === e.id),
        })),
    [events, tickets],
  );

  return (
    <div>
      <h1 className="p-2 text-2xl font-bold tracking-wider">
        {contact?.name || <InlineLoading />}
      </h1>

      <div className="flex gep-2">
        <InstantTextField
          defaultValue={contact?.name || ""}
          updateValue={(v) => contact?.incrementalPatch({ name: v! })}
          type="text"
          label="Meno"
          trim
          vertical
          validate={async (v) => (v ? null : "Meno je povinné")}
          baseClassName="grow"
        />
        <InstantTextField
          defaultValue={contact?.email || ""}
          updateValue={(v) => contact?.incrementalPatch({ email: v || "" })}
          baseClassName="grow"
          type="email"
          label="Email"
          vertical
          trim
          placeholder="email@príklad.com"
          validate={(value) =>
            yupString()
              .email("Zadajte platný email")
              .validate(value)
              .then(() => null)
              .catch((err) => err.message)
          }
        />
        <InstantTextField
          defaultValue={contact?.phone || ""}
          updateValue={(v) => contact?.incrementalPatch({ phone: v || "" })}
          baseClassName="grow"
          type="text"
          label="Telefón"
          vertical
          trim
          placeholder="+421 *** *** ***"
        />
      </div>
      <Tabs defaultValue="tickets" className="pt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tickets">Lístky</TabsTrigger>
          <TabsTrigger value="coupons">Kupóny</TabsTrigger>
        </TabsList>
        <TabsContent value="tickets">
          {groupedTickets.length === 0 ? (
            <NoResults text="Tento kontakt nie je použitý pri žiadnom lístku" /> //TODO: Pridať možnosť pridania lístku s autofill
          ) : (
            <div className="flex flex-col gap-4">
              {groupedTickets.map((event, i) => (
                <Event key={i} {...event} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="coupons">
          <p>Coming soon</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
