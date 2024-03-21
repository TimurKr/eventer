import NewContactForm from "./form";

export default async function Page() {
  return (
    <div className="p-6">
      <h1 className="pb-4 text-2xl font-bold tracking-wider">
        Vytvorte nové lístky
      </h1>
      <div className="grid place-content-center">
        <NewContactForm />
      </div>
    </div>
  );
}
