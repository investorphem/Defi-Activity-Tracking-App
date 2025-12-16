export default function StatCard({ title, value }) {
  return (
    <div className="border p-4 rounded-xl">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  );
}
