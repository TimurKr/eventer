export default function Layout(props: {
  children: React.ReactNode;
  new_event_modal: React.ReactNode;
}) {
  return (
    <>
      {props.children}
      {props.new_event_modal}
    </>
  );
}
