export default function StubPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">{title}</h1>
      <p className="text-slate-500 max-w-md">
        This feature is part of the DHARA-SOOCHAK prototype but is currently not fully implemented in this demo view.
      </p>
    </div>
  );
}
