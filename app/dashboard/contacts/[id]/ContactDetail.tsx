"use client";

import InlineLoading from "@/components/InlineLoading";
import { InstantTextField } from "@/components/forms/InstantFields";
import { Badge } from "@/components/ui/badge";
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
import { useRxData } from "@/rxdb/db";
import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import { EventsDocument } from "@/rxdb/schemas/public/events";
import { TicketsDocument } from "@/rxdb/schemas/public/tickets";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/solid";
import moment from "moment";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { string as yupString } from "yup";

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

  const { id: currentContactId } = useParams<{ id: string }>();

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
      <TableCell
        className={`${currentContactId === ticket.guest_id && "text-orange-400 font-medium"}`}
      >
        <div>
          {currentContactId === ticket.guest_id ? (
            guest?.name || <InlineLoading />
          ) : (
            <Link
              href={`/dashboard/contacts/${ticket.guest_id}`}
              className="hover:underline underline-offset-4"
            >
              {guest?.name || <InlineLoading />}
            </Link>
          )}
        </div>
      </TableCell>
      <TableCell
        className={`${currentContactId === ticket.billing_id && "text-orange-400 font-medium"}`}
      >
        {currentContactId === ticket.billing_id ? (
          billing?.name || <InlineLoading />
        ) : (
          <Button asChild variant={"link"}>
            <Link href={`/dashboard/contacts/${ticket.billing_id}`}>
              {billing?.name || <InlineLoading />}
            </Link>
          </Button>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Badge
              variant={
                ticket.payment_status === "zaplatené"
                  ? "default"
                  : ticket.payment_status === "zrušené"
                    ? "destructive"
                    : "outline"
              }
            >
              {ticket.payment_status?.toLowerCase()}
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Status Lístka</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={ticket.payment_status}
              onValueChange={(v) =>
                ticket.incrementalPatch({ payment_status: v })
              }
            >
              <DropdownMenuRadioItem value="rezervované">
                Rezervované
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="zaplatené">
                Zaplatené
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="zrušené">
                Zrušené
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
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
              <TableHead>Hosť</TableHead>
              <TableHead>Platca</TableHead>
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
          <div className="flex flex-col gap-4">
            {groupedTickets.map((event, i) => (
              <Event key={i} {...event} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="coupons">
          <p>Coming soon</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
