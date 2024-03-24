import NewContactButton from "@/app/dashboard/contacts/new/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRxData } from "@/rxdb/db";
import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import Fuse from "fuse.js";
import { useCallback, useMemo, useState } from "react";
import SearchBar from "./SearchBar";
import { ScrollArea } from "./ui/scroll-area";

export function SelectContactDialog({
  children,
  onSelected,
  closeOnSelect = true,
  onClosed,
  description,
}: {
  children: React.ReactNode;
  onSelected: (contact: ContactsDocument) => void;
  closeOnSelect?: boolean;
  onClosed?: () => void;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { result: allContacts } = useRxData(
    "contacts",
    (c) => c.find({ sort: [{ name: "asc" }] }),
    {
      initialResult: [],
    },
  );

  const contacts = useMemo(
    () =>
      !query
        ? allContacts
        : new Fuse(allContacts, {
            keys: ["name", "email", "phone"],
            shouldSort: true,
          })
            .search(query)
            .map((i) => i.item),
    [allContacts, query],
  );

  const close = useCallback(() => {
    setOpen(false);
    if (onClosed) onClosed();
  }, [onClosed]);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (value) setOpen(true);
        if (!value) close();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="!pb-0">
        <DialogHeader>
          <DialogTitle>Vyberte si kontakt</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex justify-between">
          <SearchBar
            query={query}
            search={setQuery}
            resultsCount={contacts.length}
            // Highlight first result
            selectFirstResult={() => {
              // Highlight first result
              const firstButton = document.querySelector(
                "#list-of-contacts button",
              );
              if (firstButton) {
                (firstButton as HTMLButtonElement).focus();
              }
            }}
          />
          <NewContactButton
            initialValues={
              query.includes("@")
                ? { email: query }
                : /\d/.test(query)
                  ? { phone: query }
                  : { name: query }
            }
          />
        </div>
        <ScrollArea className="max-h-120">
          <div className="divide-y pb-8 pe-4" id="list-of-contacts">
            {/* TODO: Add a create contact option */}
            {contacts.map((contact) => (
              <button
                className="group flex w-full flex-col px-2 py-2 text-xs font-light text-gray-500"
                key={contact.id}
                onClick={() => {
                  onSelected(contact);
                  if (closeOnSelect) close();
                }}
              >
                <p className="text-sm font-medium text-primary underline-offset-4 group-hover:underline">
                  {contact.name}
                </p>
                {contact.email && <p>Email: {contact.email}</p>}
                {contact.phone && <p>Telefón: {contact.phone}</p>}
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
