export default function AppLoading() {
  return (
    <div className="flex-1 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
