"use client";

import { useEffect, useState } from "react";
import { AppleLogo, Battery, Wifi } from "./Icons";
import { useWindows } from "./windows/WindowManager";

const menus = ["File", "Edit", "View", "Go", "Window", "Help"];

function formatClock(date: Date) {
  const day = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day}  ${time}`;
}

export default function MenuBar() {
  const [clock, setClock] = useState("");
  const { windows, focusedId } = useWindows();
  const activeTitle = windows.find((win) => win.id === focusedId)?.title ?? "Felix Pfeiffer";

  useEffect(() => {
    const tick = () => setClock(formatClock(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="menubar fixed inset-x-0 top-0 z-[9500] flex h-7 items-center justify-between px-4 text-[13px] text-white">
      <nav className="flex items-center gap-5">
        <AppleLogo className="h-4 w-4" />
        <span className="font-bold">{activeTitle}</span>
        {menus.map((menu) => (
          <span key={menu} className="hidden sm:inline">{menu}</span>
        ))}
      </nav>
      <div className="flex items-center gap-4">
        <Battery />
        <Wifi />
        <span className="min-w-32 text-right tabular-nums">{clock}</span>
      </div>
    </header>
  );
}
