export default function ObjectDetailsList({
  data,
}: {
  data: Record<string, string | string[] | number | null>;
}) {
  return (
    <table>
      <tbody>
        {Object.entries(data).map((entry) => {
          const key = entry[0];
          const value = entry[1];

          return (
            <tr key={key} className="odd:bg-secondary/50">
              <td className="whitespace-nowrap p-2 align-top text-sm capitalize">
                {key}
              </td>
              <td className="text-muted-foreground p-2 align-top text-sm">
                {value
                  ? (typeof value === "string"
                      ? value
                      : typeof value === "number"
                        ? value.toLocaleString()
                        : value.join(", ")) || "-"
                  : "-"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
