import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Vyberte si kontakt</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid px-1 place-content-center">
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
        </div>
        <ScrollArea>
          <div
            className="flex max-h-80 flex-col gap-2 pe-4"
            id="list-of-contacts"
          >
            {/* TODO: Add a create contact option */}
            {contacts.map((contact) => (
              <button
                className="w-full rounded-md border shadow-sm flex flex-col py-1 px-2"
                key={contact.id}
                onClick={() => {
                  onSelected(contact);
                  if (closeOnSelect) close();
                }}
              >
                <p className="font-medium">{contact.name}</p>
                <p className="font-light text-gray-500 text-xs">
                  {[contact.email, contact.phone].filter(Boolean).join(" - ")}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
