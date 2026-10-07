"use client";

import { useState } from "react";
import DesktopIcons from "./DesktopIcons";
import Dock from "./Dock";
import MailWindow from "./MailWindow";
import ProfileWindow from "./ProfileWindow";

export default function Desktop() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);

  const open = (id: string) => {
    if (id === "profile") setProfileOpen(true);
    if (id === "mail") setMailOpen(true);
  };

  return (
    <>
      <DesktopIcons onOpen={open} />
      <Dock onOpen={open} />
      {mailOpen && <MailWindow onClose={() => setMailOpen(false)} />}
      {profileOpen && <ProfileWindow onClose={() => setProfileOpen(false)} />}
    </>
  );
}
