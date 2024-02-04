import Events from "./clientComponent";

export default async function Page() {
  // const eventsPromise = fetchEvents();
  // const ticketTypesPromise = fetchTicketTypes();

  // const [fetchedEventsResponse, fetchedTicketTypesResponse] = await Promise.all(
  //   [eventsPromise, ticketTypesPromise],
  // );

  // // const { data: events, error } = await fetchEvents();
  // if (fetchedEventsResponse.error) {
  //   throw new Error(fetchedEventsResponse.error.message);
  // }

  return (
    <Events
    // events={fetchedEventsResponse.data}
    // ticketTypes={fetchedTicketTypesResponse.data}
    />
  );
}
