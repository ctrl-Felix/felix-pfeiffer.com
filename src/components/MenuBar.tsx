"use client";

import { useEffect, useRef, useState } from "react";
import { AppleLogo, Battery, Wifi } from "./Icons";
import { buildMenus } from "./menus";
import { useWindows } from "./windows/WindowManager";

function formatClock(date: Date) {
  const day = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day}  ${time}`;
}

export default function MenuBar() {
  const [clock, setClock] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const barRef = useRef<HTMLElement>(null);
  const windows = useWindows();
  const active = windows.windows.find((win) => win.id === windows.focusedId);
  const menus = buildMenus(windows, active);

  useEffect(() => {
    const tick = () => setClock(formatClock(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!openId) return;
    const close = (event: PointerEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setOpenId(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenId(null);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [openId]);

  return (
    <header className="menubar fixed inset-x-0 top-0 z-[9500] flex h-7 items-center justify-between px-2 text-[13px] text-white">
      <nav ref={barRef} className="flex items-center">
        {menus.map((menu) => (
          <div key={menu.id} className={`relative ${menu.compactHidden ? "hidden sm:block" : ""}`}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={openId === menu.id}
              onClick={() => setOpenId(openId === menu.id ? null : menu.id)}
              onPointerEnter={() => openId && setOpenId(menu.id)}
              className={`flex h-6 items-center rounded-md px-2.5 ${menu.bold ? "font-bold" : ""} ${openId === menu.id ? "bg-white/25" : "hover:bg-white/15"}`}
            >
              {menu.id === "apple" ? <AppleLogo className="h-4 w-4" /> : menu.label}
            </button>
            {openId === menu.id && (
              <ul role="menu" className="absolute left-0 top-7 min-w-48 rounded-xl bg-[#f5f5f7]/80 p-1.5 text-[#1d1d1f] shadow-[0_12px_40px_rgba(0,0,0,0.35),0_0_0_0.5px_rgba(0,0,0,0.15)] backdrop-blur-2xl backdrop-saturate-200 [text-shadow:none]">
                {menu.items.map((item, index) =>
                  item.separator ? (
                    <li key={index} role="separator" className="my-1 h-px bg-black/10" />
                  ) : (
                    <li key={index} role="none">
                      <button
                        type="button"
                        role="menuitem"
                        disabled={item.disabled}
                        onClick={() => {
                          setOpenId(null);
                          item.onSelect?.();
                        }}
                        className="flex w-full items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1 text-left hover:bg-[#0a84ff] hover:text-white disabled:text-black/30 disabled:hover:bg-transparent disabled:hover:text-black/30"
                      >
                        <span className="w-3 text-xs">{item.checked ? "✓" : ""}</span>
                        {item.label}
                      </button>
                    </li>
                  ),
                )}
              </ul>
            )}
          </div>
        ))}
      </nav>
      <div className="flex items-center gap-4 px-2">
        <Battery />
        <Wifi />
        <span className="min-w-32 text-right tabular-nums">{clock}</span>
      </div>
    </header>
  );
}
