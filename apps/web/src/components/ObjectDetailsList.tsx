export default function ObjectDetailsList({ data }: { data: object }) {
  return (
    <div className="grid">
      {Object.entries(data).map((entry) => (
        <div
          key={entry[0]}
          className="odd:bg-secondary/50 flex justify-between gap-2 px-4 py-2"
        >
          <p className="text-sm">{entry[0]}</p>
          <p className="text-muted-foreground text-right text-sm">
            {String(entry[1])}
          </p>
        </div>
      ))}
    </div>
  );
}
