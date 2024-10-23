import AddWordsButton from "./add-words-button";
import WardsTable from "./words-table";

export default function WordsPage() {
  return (
    <div className="container my-8 max-w-screen-xl space-y-16 px-4 md:px-8">
      <div className="flex items-center gap-4">
        <p className="text-lg font-semibold">Words</p>
        <div className="flex flex-1 items-center justify-end gap-2">
          <AddWordsButton />
        </div>
      </div>
      <WardsTable />
    </div>
  );
}
