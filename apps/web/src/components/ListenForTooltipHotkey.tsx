"use client";

import { useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { useShowHotkeys } from "~/store/show-hotkeys-store";

export default function ListenForTooltipHotkey() {
  const setShowHotkeys = useShowHotkeys((state) => state.setShowTooltips);

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
