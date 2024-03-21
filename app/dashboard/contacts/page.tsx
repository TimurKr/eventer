"use client";

import CreateFirst from "@/components/CreateFirst";
import Loading from "@/components/Loading";
import NoResults from "@/components/NoResults";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRxData } from "@/rxdb/db";
import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import {
  ChevronDownIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import Fuse from "fuse.js";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../../../components/Header";
import NewContactButton from "./new-contact/button";

const PAGINATION = 100;

function ContactRow({ contact }: { contact: ContactsDocument }) {
  const { result: tickets } = useRxData(
    "tickets",
    (c) =>
      c.find({
        selector: {
          $or: [{ guest_id: contact.id }, { billing_id: contact.id }],
        },
      }),
    { initialResult: [] },
  );

  const { result: coupons } = useRxData(
    "coupons",
    (c) =>
      c.find({
        selector: { contact_id: contact.id },
      }),
    { initialResult: [] },
  );

  const router = useRouter();
  useEffect(() => {
    router.prefetch(`/dashboard/contacts/${contact.id}`);
  }, [contact.id, router]);

  return (
    <TableRow
      onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
      className="cursor-pointer"
    >
      <TableCell>{contact.name}</TableCell>
      <TableCell>{contact.email || "-"}</TableCell>
      <TableCell>{contact.phone || "-"}</TableCell>
      <TableCell>{tickets.length}</TableCell>
      <TableCell>{coupons.length}</TableCell>
    </TableRow>
  );
}

export default function Contacts() {
  const q = useSearchParams().get("query");
  const [query, setQuery] = useState(q || "");
  const [displayCount, setDisplayCount] = useState(PAGINATION);

  const [sort, setSort] =
    useState<keyof Pick<ContactsDocument, "name" | "email" | "phone">>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const { result: allContacts, isFetching: isFetchingContacts } = useRxData(
    "contacts",
    useCallback(
      (c) =>
        c.find({
          sort: [{ [sort]: sortDirection }],
        }),
      [sort, sortDirection],
    ),
    { initialResult: [] },
  );

  const contacts = useMemo(
    () =>
      query
        ? new Fuse(allContacts, {
            keys: ["name", "email", "phone"],
            shouldSort: false,
          })
            .search(query)
            .map((r) => r.item)
        : allContacts,
    [query, allContacts],
  );

  const SortableTableHead = ({
    title,
    sorting,
    setSorting,
  }: {
    title: string;
    sorting?: "asc" | "desc";
    setSorting: (dir: "asc" | "desc") => void;
  }) => (
    <TableHead>
      <div className="flex items-center gap-2">
        {title}
        <Button
          variant={"ghost"}
          size={"icon"}
          className="h-auto w-auto p-1"
          onClick={() => setSorting(sorting === "asc" ? "desc" : "asc")}
        >
          {sort === "name" ? (
            sortDirection === "asc" ? (
              <ChevronUpIcon className="w-4" />
            ) : (
              <ChevronDownIcon className="w-4" />
            )
          ) : (
            <ChevronUpDownIcon className="w-4" />
          )}
        </Button>
      </div>
    </TableHead>
  );

  return (
    <>
      <Header
        title="Kontakty"
        actionButton={<NewContactButton />}
        search={{
          search: (query) => setQuery(query),
          query,
          resultsCount: contacts.length || 0,
        }}
      />
      <div className="p-4 pt-0">
        {contacts.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-200 first:*:rounded-tl-lg last:*:rounded-tr-lg">
                  <SortableTableHead
                    title="Meno"
                    sorting={sort === "name" ? sortDirection : undefined}
                    setSorting={(dir) => {
                      setSort("name");
                      setSortDirection(dir);
                    }}
                  />
                  <TableHead>Email</TableHead>
                  <TableHead>Telefón</TableHead>
                  <TableHead>Množstvo lístkov</TableHead>
                  <TableHead>Množstvo kupónov</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.slice(0, displayCount).map((contact) => (
                  <ContactRow key={contact.id} contact={contact} />
                ))}
              </TableBody>
            </Table>
            {contacts.length > displayCount && (
              <div className="flex flex-col items-center gap-2 py-2">
                <p className="text-xs text-gray-500">
                  Aktuálne zobrazených {displayCount} z {contacts.length}{" "}
                  kontaktov.
                </p>
                <Button
                  onClick={() =>
                    setDisplayCount(
                      displayCount + PAGINATION > contacts.length
                        ? contacts.length
                        : displayCount + PAGINATION,
                    )
                  }
                  variant={"secondary"}
                  size={"sm"}
                >
                  Zobraziť viac
                </Button>
              </div>
            )}
          </>
        ) : isFetchingContacts ? (
          <Loading text="Načítavam kotakty..." />
        ) : query ? (
          <NoResults text="Nenašli sme žiadne kontakty vyhovujúce vášmu hladaniu...">
            <NewContactButton />
          </NoResults>
        ) : (
          <CreateFirst text="Nemáte žiadne kontakty. Vytvorte si svoj prvý...">
            <NewContactButton />
          </CreateFirst>
        )}
      </div>
    </>
  );
}
