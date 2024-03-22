"use client";

import SubmitButton from "@/components/forms/SubmitButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form } from "@/components/ui/form";
import { FormTextField } from "@/components/ui/form-text-field";
import { useRxCollection } from "@/rxdb/db";
import { ContactsDocument } from "@/rxdb/schemas/public/contacts";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { contactsEqual } from "../../events/utils";

const formSchema = z.object({
  name: z.string().min(1, "Meno je povinné"),
  email: z.string().email("Zadajte platný email").or(z.literal("")),
  phone: z.string(),
});

type Values = z.infer<typeof formSchema>;

export default function NewContactForm(initValues?: Partial<Values>) {
  const router = useRouter();

  const form = useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      ...initValues,
    },
  });

  const contactsCollection = useRxCollection("contacts");

  const [duplicateContact, setDuplicateContact] = useState<ContactsDocument>();
  const [duplicateName, setDuplicateName] = useState<ContactsDocument>();
  const [duplicateCache, setDuplicateCache] = useState<ContactsDocument[]>([]);

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      const dc = duplicateCache.find((c) => contactsEqual(c, value));
      const dn = duplicateCache.find((c) => c.name === value.name);
      setDuplicateContact(dc);
      setDuplicateName(dc ? undefined : dn);
    });
    return () => subscription.unsubscribe();
  }, [duplicateCache, form]);

  const onSubmit = useCallback(
    async (values: Values) => {
      if (!contactsCollection) return;

      if (!duplicateContact) {
        const existingContact = await contactsCollection
          .findOne({
            selector: values,
          })
          .exec();

        if (existingContact) {
          setDuplicateContact(existingContact);
          setDuplicateCache((prev) => [...prev, existingContact]);
          return;
        }
      }

      if (!duplicateName) {
        const existingContact = await contactsCollection
          .findOne({
            selector: { name: values.name },
          })
          .exec();

        if (existingContact) {
          setDuplicateName(existingContact);
          setDuplicateCache((prev) => [...prev, existingContact]);
          return;
        }
      }

      const newContact = await contactsCollection.insert({
        ...values,
        id: crypto.randomUUID(),
      });

      toast.success("Kontakt vytvorený!", { autoClose: 2500 });
      router.replace(`/dashboard/contacts/${newContact.id}`);
    },
    [contactsCollection, duplicateContact, duplicateName, router],
  );

  return (
    <Form form={form} onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormTextField form={form} name={"name"} label="Meno" horizontal />
      <FormTextField form={form} name={"email"} label="Email" horizontal />
      <FormTextField form={form} name={"phone"} label="Telefón" horizontal />
      {duplicateContact && (
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>Kontakt už existuje</AlertTitle>
          <AlertDescription>
            <Link
              href={`/dashboard/contacts/${duplicateContact.id}`}
              className="underline-offset-4 hover:underline"
            >
              Detail
            </Link>
          </AlertDescription>
        </Alert>
      )}
      {duplicateName && (
        <Alert variant="warning">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>Kontakt s rovankým menom už existuje</AlertTitle>
          <AlertDescription>
            <Link
              href={`/dashboard/contacts/${duplicateName.id}`}
              className="underline-offset-4 hover:underline"
            >
              Detail
            </Link>
          </AlertDescription>
        </Alert>
      )}
      <SubmitButton
        className="self-end"
        isSubmitting={form.formState.isSubmitting}
        label={duplicateContact || duplicateName ? "Vytvoriť nový" : "Vytvoriť"}
        submittingLabel="Vytváram..."
      />
    </Form>
  );
}