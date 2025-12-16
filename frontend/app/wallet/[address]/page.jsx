export default async function Wallet({ params }) {
  const res = await fetch(
    process.env.NEXT_PUBLIC_API_URL + '/api/wallet/' + params.address,
    { headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY } }
  );
  const events = await res.json();

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">Wallet {params.address}</h1>
      <pre>{JSON.stringify(events, null, 2)}</pre>
    </main>
  );
}
