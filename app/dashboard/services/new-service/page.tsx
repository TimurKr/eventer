import NewServicePage from "./Form";

export default async function Page() {
  return (
    <div>
      <h1 className="p-2 pt-4 text-2xl font-bold tracking-wider">
        Nové predstavenie
      </h1>
      <div className="grid place-content-center">
        <NewServicePage />
      </div>
    </div>
  );
}
