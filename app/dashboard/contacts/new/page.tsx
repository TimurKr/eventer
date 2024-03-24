import NewContactForm, { NewContactFormProps } from "./form";

export default async function Page({
  searchParams,
}: {
  searchParams: NewContactFormProps["initValues"];
}) {
  return (
    <div className="p-6">
      <h1 className="pb-4 text-2xl font-bold tracking-wider">
        Vytvorte nové lístky
      </h1>
      <div className="grid place-content-center">
        <NewContactForm initValues={searchParams} />
      </div>
    </div>
  );
}
