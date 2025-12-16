export default function EventsTable({ events }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          <th>Sender</th>
          <th>Type</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {events.map(e => (
          <tr key={e.tx_id}>
            <td>{e.sender}</td>
            <td>{e.event_type}</td>
            <td>{e.amount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
