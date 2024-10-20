export default function PageHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-green-50 p-4 border-b fixed top-0 right-0 left-64 z-10">
      <h1 className="text-2xl font-bold text-emerald-800">{children}</h1>
    </div>
  );
}
