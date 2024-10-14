"use client";

import { useMemo, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { useSession } from "next-auth/react";

import type { UserWordWithWord } from "@acme/api/validators";
import { hasPowerUserAccess } from "@acme/core/helpers";

import AddWordsDialog from "~/components/dialogs/add-words-dialog";
import StartTrainingDialog from "~/components/dialogs/start-training-dialog";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { unimplementedToast } from "~/utils/helpers";

export default function AddButton() {
  const [wordsList, setWordsList] = useState<UserWordWithWord[]>([]);
  const [showTrainigSessionDialog, setShowTrainigSessionDialog] =
    useState(false);
  const [
    showAddWordsToPracticeListDialog,
    setShowAddWordsToPracticeListDialog,
  ] = useState(false);

  const { data } = useSession();
  const isPowerUser = useMemo(
    () => hasPowerUserAccess(data?.user.role ?? ""),
    [data?.user.role],
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            Start Learning...
            <ChevronDownIcon className="-mr-1 ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => setShowTrainigSessionDialog(true)}>
            Start a Training Session
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowAddWordsToPracticeListDialog(true)}
          >
            Add Words to Practice List
          </DropdownMenuItem>
          {isPowerUser && (
            <DropdownMenuItem onClick={unimplementedToast}>
              Add Module
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <StartTrainingDialog
        open={showTrainigSessionDialog}
        onOpenChange={(open) => {
          setShowTrainigSessionDialog(open);
          if (!open) {
            setWordsList([]);
          }
        }}
        words={wordsList.map((word) => word.word)}
      />

      <AddWordsDialog
        open={showAddWordsToPracticeListDialog}
        onOpenChange={setShowAddWordsToPracticeListDialog}
        title="Add Words to Practice List"
        action={{
          onClick: (list) => {
            setWordsList(list);
            setShowAddWordsToPracticeListDialog(false);
            setShowTrainigSessionDialog(true);
          },
          title: "Start Training",
        }}
      />
    </>
  );
}
