import NewContactForm from "@/app/dashboard/contacts/new/form";
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
import { UserPlusIcon } from "@heroicons/react/24/outline";
import Fuse from "fuse.js";
import { useCallback, useMemo, useState } from "react";
import SearchBar from "./SearchBar";
import { Button } from "./ui/button";
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

  const handleSelected = useCallback(
    (contact: ContactsDocument) => {
      onSelected(contact);
      if (closeOnSelect) close();
    },
    [onSelected, closeOnSelect, close],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (value) setOpen(true);
        if (!value) close();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-dvh !pb-0">
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
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button">
                <UserPlusIcon className="mr-2 h-4 w-4" />
                Vytvoriť kontakt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>Vytvorte nový kontakt</DialogHeader>
              <NewContactForm
                initValues={
                  query.includes("@")
                    ? { email: query }
                    : /\d/.test(query)
                      ? { phone: query }
                      : query
                        ? { name: query }
                        : undefined
                }
                onSubmit={handleSelected}
              />
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="max-h-72 sm:max-h-96">
          <div className="divide-y pb-8 pe-4" id="list-of-contacts">
            {/* TODO: Add a create contact option */}
            {contacts.map((contact) => (
              <button
                className="group flex w-full flex-col px-2 py-2 text-xs font-light text-gray-500"
                key={contact.id}
                onClick={() => handleSelected(contact)}
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
