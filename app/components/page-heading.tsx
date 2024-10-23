interface PageHeadingProps {
  title: string;
}

export default function PageHeading({ title }: PageHeadingProps) {
  return (
    <div className="bg-green-50 p-4 border-b fixed top-0 right-0 left-64 z-10">
      <h1 className="text-2xl font-bold text-emerald-800">{title}</h1>
    </div>
  );
}
