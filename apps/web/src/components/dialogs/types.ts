import type { Dispatch, SetStateAction } from "react";

export type UseDialogHookValue<Props = unknown> = [
  (props: Props) => JSX.Element,
  boolean,
  Dispatch<SetStateAction<boolean>>,
];
