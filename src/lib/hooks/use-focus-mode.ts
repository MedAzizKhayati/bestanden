"use client";

import { useEffect, useRef } from "react";
import { useSidebar } from "@/components/ui/sidebar";

/** Collapse the sidebar while `active` (e.g. during an exercise) and restore it afterwards. */
export function useFocusMode(active: boolean) {
  const { open, setOpen, isMobile } = useSidebar();
  const restore = useRef(false);
  const openRef = useRef(open);
  const setOpenRef = useRef(setOpen);

  useEffect(() => {
    openRef.current = open;
    setOpenRef.current = setOpen;
  });

  useEffect(() => {
    if (!active || isMobile) return;
    if (openRef.current) {
      restore.current = true;
      setOpenRef.current(false);
    }
    return () => {
      if (restore.current) {
        restore.current = false;
        setOpenRef.current(true);
      }
    };
  }, [active, isMobile]);
}
