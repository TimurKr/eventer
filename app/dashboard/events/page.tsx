import EventsAccordion from "./components/EventsAccordion";
import { fetchEvents, fetchTicketTypes } from "./serverActions";

export default async function Page() {
  const eventsPromise = fetchEvents();
  const ticketTypesPromise = fetchTicketTypes();

  const [
    { data: events, error: eventsError },
    { data: ticketTypes, error: ticketTypesError },
  ] = await Promise.all([eventsPromise, ticketTypesPromise]);

  // const { data: events, error } = await fetchEvents();
  if (eventsError) {
    console.error(eventsError);
    return <div>Error loading events</div>;
  }

  return (
    <div className="flex flex-col">
      <EventsAccordion events={events!} ticketTypes={ticketTypes} />
    </div>
  );
}
