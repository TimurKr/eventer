"use client";

import { InstantTextField } from "@/utils/forms/FormElements";
import { useRouter } from "next/navigation";
import { updateContactFields } from "../../events/serverActions";
import { useStoreContext } from "../../store";

export default function ContactDetail({ id }: { id: string }) {
  const { contact, setPartialContact } = useStoreContext((state) => ({
    contact: state.events.contacts.find((c) => c.id.toString() == id),
    setPartialContact: state.events.setPartialContact,
  }));
  const router = useRouter();
  if (!contact) {
    router.replace("/dashboard"); // TODO v2: error as search param
    return null;
  }
  return (
    <div>
      <InstantTextField
        defaultValue={contact.name}
        label="Name"
        type="text"
        vertical
        setLocalValue={(name) =>
          setPartialContact({ id: contact.id, name: name || undefined })
        }
        updateDatabase={async (name) =>
          await updateContactFields({ id: contact.id, name: name || undefined })
        }
      />
    </div>
  );
}
