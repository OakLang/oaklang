"use client";

import { useState } from "react";

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
