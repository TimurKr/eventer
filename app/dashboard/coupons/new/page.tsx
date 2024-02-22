import EditEventForm from "./form";

export default async function Page() {
  return (
    <div>
      <h1 className="p-2 pt-4 text-2xl font-bold tracking-wider">
        Vytvorte si nový poukaz
      </h1>
      <div className="grid place-content-center">
        <EditEventForm />
      </div>
    </div>
  );
}
