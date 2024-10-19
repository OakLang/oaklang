"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";

import AddWordsDialog from "~/components/dialogs/add-words-dialog";
import { Button } from "~/components/ui/button";

export default function AddWordsButton() {
  const [
    showAddWordsToPracticeListDialog,
    setShowAddWordsToPracticeListDialog,
  ] = useState(false);

  return (
    <>
      <Button onClick={() => setShowAddWordsToPracticeListDialog(true)}>
        <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
        Add Words
      </Button>

      <AddWordsDialog
        open={showAddWordsToPracticeListDialog}
        onOpenChange={setShowAddWordsToPracticeListDialog}
        title="Add Words"
        // action={{
        //   onClick: (list) => {
        //     setShowAddWordsToPracticeListDialog(false);
        //   },
        //   title: "Start Training",
        // }}
      />
    </>
  );
}
