"use client";

import ConvertToCouponModal from "@/app/dashboard/events/_modals/ConvertToCouponModal";
import MoveTicketsToDifferentEventModal from "@/app/dashboard/events/_modals/MoveTicketsToDifferentEventModal";
import EditEventButton from "@/app/dashboard/events/edit-event/button";
import NewTicketsButton from "@/app/dashboard/events/new-tickets/button";
import EventRow from "@/components/EventRow";
import TicketRow from "@/components/TicketRow";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useRxCollection } from "@/rxdb/db";
import { EventsDocument } from "@/rxdb/schemas/public/events";
import { TicketsDocument } from "@/rxdb/schemas/public/tickets";
import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/solid";
import { isToday } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";

export default function EventDetail({
  event,
  tickets,
  allHighlightedTickets,
  hideCancelled = true,
  editable = true,
}: {
  event: EventsDocument;
  tickets: TicketsDocument[];
  allHighlightedTickets?: TicketsDocument[];
  hideCancelled?: boolean;
  editable?: boolean;
}) {
  const [lockedArrived, setLockedArrived] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCancelledTickets, setShowCancelledTickets] = useState(false);
  const [selectedTickets, _setSelectedTickets] = useState<TicketsDocument[]>(
    [],
  );

  const toggleSelectedTicket = useCallback(
    (tickets: TicketsDocument | TicketsDocument[]) => {
      let newSelectedTickets = selectedTickets;
      if (!Array.isArray(tickets)) {
        tickets = [tickets];
      }
      tickets.forEach((ticket) => {
        if (newSelectedTickets.find((st) => st === ticket)) {
          newSelectedTickets = newSelectedTickets.filter(
            (t) => t.id !== ticket.id,
          );
        } else {
          newSelectedTickets = [...newSelectedTickets, ticket];
        }
      });
      _setSelectedTickets(newSelectedTickets);
    },
    [selectedTickets],
  );

  const ticketsCollection = useRxCollection("tickets");

  const { highlightedTickets, highlightedCancelledTickets } = useMemo(() => {
    return {
      highlightedTickets: allHighlightedTickets?.filter(
        (t) => t.payment_status != "zrušené",
      ),
      highlightedCancelledTickets: allHighlightedTickets?.filter(
        (t) => t.payment_status == "zrušené",
      ),
    };
  }, [allHighlightedTickets]);

  const isShown =
    isExpanded ||
    highlightedTickets?.length ||
    highlightedCancelledTickets?.length;

  const cancelledTickets = useMemo(
    () =>
      hideCancelled ? tickets.filter((t) => t.payment_status == "zrušené") : [],
    [hideCancelled, tickets],
  );

  tickets = useMemo(
    () =>
      hideCancelled
        ? tickets.filter((t) => t.payment_status != "zrušené")
        : tickets,
    [hideCancelled, tickets],
  );

  const contactsCollection = useRxCollection("contacts");

  const generateEmails = useCallback(
    async (type: "guest_id" | "billing_id") => {
      if (!contactsCollection || !tickets.length) return [];
      const _tickets = tickets.filter((t) => t.payment_status != "zrušené");
      const contacts = await contactsCollection
        .find({
          selector: { id: { $in: _tickets.map((t) => t[type]) } },
        })
        .exec();
      return contacts.filter((c) => !!c.email).map((c) => c.email!);
    },
    [contactsCollection, tickets],
  );

  return (
    <Card
      className={cn(
        "overflow-hidden",
        isToday(new Date(event.datetime)) &&
          "border-orange-200 shadow-lg shadow-orange-100",
      )}
    >
      <CardHeader className="overflow-clip p-0">
        <EventRow
          event={event}
          onClick={() => setIsExpanded(!isExpanded)}
          actionButton={<NewTicketsButton eventId={event.id.toString()} />}
        />
      </CardHeader>
      <CardContent
        className={`grid transition-all duration-300 ease-in-out ${
          isShown
            ? "grid-rows-[1fr] p-4 pt-2 opacity-100"
            : "grid-rows-[0fr] p-0 opacity-0"
        }`}
      >
        <div className="overflow-auto">
          {editable && (
            <>
              <div className="flex items-end justify-end gap-2 overflow-y-hidden">
                <EditEventButton eventId={event.id.toString()} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size={"sm"}>
                      <ArrowTopRightOnSquareIcon className="me-2 h-4 w-4" />
                      Exportovať
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Emaily</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={async () => {
                        const emails = await generateEmails("guest_id");
                        try {
                          await navigator.clipboard.writeText(
                            emails.join(", "),
                          );
                          alert(
                            `Emaily (${emails.length}) skopírované: ${emails.join(", ")}`,
                          );
                        } catch (err) {
                          console.error("Failed to copy text: ", err);
                        }
                      }}
                    >
                      Hostia
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        const emails = await generateEmails("billing_id");
                        try {
                          await navigator.clipboard.writeText(
                            emails.join(", "),
                          );
                          alert(
                            `Emaily (${emails.length}) skopírované: ${emails.join(", ")}`,
                          );
                        } catch (err) {
                          console.error("Failed to copy text: ", err);
                        }
                      }}
                    >
                      Platcovia
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  type="button"
                  variant="destructive"
                  size={"sm"}
                  className="ms-auto"
                  onClick={() => {
                    if (tickets?.length) {
                      alert(
                        "Nemôžete vymazať udalosť, ktorá má predané lístky. Najprv vymažte lístky.",
                      );
                      return;
                    }
                    if (!confirm("Naozaj chcete vymazať túto udalosť?")) return;
                    event.remove();
                  }}
                >
                  <TrashIcon className="me-2 h-4 w-4"></TrashIcon>
                  Vymazať udalosť
                </Button>
              </div>
              <Separator orientation="horizontal" className="my-2" />
            </>
          )}
          <div className="flex items-center gap-2 py-2">
            <p className="text-md ps-2 font-medium tracking-wider text-gray-700">
              Lístky
            </p>
            {/* <div className="mx-4 h-px flex-grow bg-stone-400" /> */}
            <div className="flex flex-col text-xs text-gray-500">
              {highlightedTickets && highlightedCancelledTickets && (
                <span>
                  <span className="font-semibold">
                    {highlightedTickets.length +
                      highlightedCancelledTickets.length}{" "}
                  </span>
                  nájdených lítkov
                </span>
              )}
              {highlightedCancelledTickets && (
                <span>
                  z toho{" "}
                  <span className="font-semibold">
                    {highlightedCancelledTickets.length}{" "}
                  </span>
                  zrušených
                </span>
              )}
            </div>
            {selectedTickets.length > 0 && (
              <>
                <p className="ms-auto text-sm text-gray-600">
                  (Označených: {selectedTickets.length})
                </p>
                <MoveTicketsToDifferentEventModal
                  originalEvent={event}
                  selectedTickets={selectedTickets}
                />
                <ConvertToCouponModal selectedTickets={selectedTickets} />
                <Button
                  variant={"destructive"}
                  size={"xs"}
                  onClick={() => {
                    if (selectedTickets.length === 0) {
                      alert("Zvoľte aspoň jeden lístok");
                      return;
                    }
                    if (
                      !confirm(
                        `POZOR! Táto akcia je nevratná, stratíte všetky údaje. Naozaj chcete vymazať označené lístky (${selectedTickets.length})? Zvážte iba zmenu statusu na zrušené.`,
                      )
                    )
                      return;
                    ticketsCollection?.bulkRemove(
                      selectedTickets.map((t) => t.id),
                    );
                    toggleSelectedTicket(selectedTickets);
                  }}
                >
                  Vymazať
                </Button>
              </>
            )}
          </div>
          {tickets.length > 0 || cancelledTickets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">
                    #
                    <Checkbox
                      className="ms-2"
                      checked={
                        selectedTickets.length === tickets.length &&
                        tickets.length > 0
                      }
                      onCheckedChange={() =>
                        toggleSelectedTicket(
                          selectedTickets.length === tickets.length
                            ? tickets
                            : tickets.filter(
                                (t) => !selectedTickets.includes(t),
                              ),
                        )
                      }
                    />
                  </TableHead>
                  <TableHead>Typ lístka</TableHead>
                  <TableHead className="text-center">Hosť</TableHead>
                  <TableHead className="text-center">Platca</TableHead>
                  <TableHead>Status</TableHead>
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
                  <TableHead className="text-end">Poznámka</TableHead>
                  <TableHead className="text-end">Cena</TableHead>
                  <TableHead className="sr-only"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket, i) => (
                  <TicketRow
                    key={ticket.id}
                    index={i + 1}
                    ticket={ticket}
                    disableArrived={lockedArrived}
                    selectCheckbox={{
                      checked: !!selectedTickets.find(
                        (t) => t.id === ticket.id,
                      ),
                      onCheckedChange: () => toggleSelectedTicket(ticket),
                    }}
                  />
                ))}
                {cancelledTickets.length > 0 && (
                  <>
                    <TableRow>
                      <TableCell
                        className="text-center"
                        colSpan={9}
                        onClick={() =>
                          setShowCancelledTickets(!showCancelledTickets)
                        }
                      >
                        <Button variant="ghost" size={"xs"}>
                          <ChevronDownIcon
                            className={`me-2 ${
                              showCancelledTickets ? "rotate-180 transform" : ""
                            } h-4 w-4 transition-transform duration-500 group-hover:text-gray-600`}
                          />
                          Zrušené lístky
                        </Button>
                      </TableCell>
                    </TableRow>
                    {(showCancelledTickets || highlightedCancelledTickets) &&
                      cancelledTickets.map((ticket, i) => (
                        <TicketRow
                          key={ticket.id}
                          index={i + 1}
                          ticket={ticket}
                          disableArrived={lockedArrived}
                        />
                      ))}
                  </>
                )}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
              Žiadne lístky
              <NewTicketsButton eventId={event.id.toString()} size="xs" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
