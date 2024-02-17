import NewServicePage from "./Form";

export default async function Page({
  searchParams,
}: {
  searchParams: { serviceId?: string };
}) {
  return (
    <div>
      <h1 className="p-2 pt-4 text-2xl font-bold tracking-wider">
        {searchParams.serviceId
          ? "Upraviť predstavenie"
          : "Vytvorte si nové predstavenie"}
      </h1>
      <div className="grid place-content-center">
        <NewServicePage serviceId={searchParams.serviceId} />
      </div>
    </div>
  );
}
