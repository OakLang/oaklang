export default function InfoTable({
  data,
}: {
  data: {
    label: string;
    value: string;
  }[];
}) {
  return (
    <table className="w-full border-spacing-5">
      <tbody>
        {data.map((entry) => (
          <tr key={entry.label}>
            <td className="w-[0%] whitespace-nowrap py-1 pr-4 font-medium">
              {entry.label}
            </td>
            <td className="py-1">{entry.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
