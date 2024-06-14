"use client";

import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { useHotkeys } from "react-hotkeys-hook";

import { showHotkeysAtom } from "~/store/show-tooltips";

export default function ListenForTooltipHotkey() {
  const setShowHotkeys = useSetAtom(showHotkeysAtom);

  useHotkeys(
    "ctrl",
    () => {
      setShowHotkeys(true);
    },
    { keydown: true },
  );

  useHotkeys(
    "ctrl",
    () => {
      setShowHotkeys(false);
    },
    { keyup: true },
  );

  useEffect(() => {
    const onFocusOut = () => {
      setShowHotkeys(false);
    };
    window.addEventListener("blur", onFocusOut);
    return () => {
      window.removeEventListener("blur", onFocusOut);
    };
  }, [setShowHotkeys]);

  return null;
}
