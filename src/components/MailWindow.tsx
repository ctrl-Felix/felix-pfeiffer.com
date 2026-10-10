"use client";

import { useState } from "react";
import { profile } from "@/data/profile";
import { useWindow } from "./windows/context";
import TrafficLights from "./windows/TrafficLights";

type Status = { kind: "idle" | "sending" | "sent" | "error"; message?: string };

const inputClass = "min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-black/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 border-b border-black/10 px-4 py-2">
      <span className="w-14 shrink-0 text-right text-[13px] text-black/45">{label}</span>
      {children}
    </label>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M3 11.5L20.5 3.5 13 21l-2.3-7.2z" />
    </svg>
  );
}

export default function MailWindow() {
  const { dragProps } = useWindow();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus({ kind: "sending" });
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      form.reset();
      setStatus({ kind: "sent" });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "Something went wrong." });
    }
  }

  return (
    <div className="flex h-full flex-col bg-white/90 text-[#1d1d1f]">
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-black/10 bg-[#f6f6f8] px-4" {...dragProps}>
          <TrafficLights />
          <h1 className="text-[13px] font-semibold">New Message</h1>
          <button
            type="submit"
            aria-label="Send"
            disabled={status.kind === "sending"}
            className="flex h-7 w-9 items-center justify-center rounded-full bg-[#0a84ff] text-white disabled:opacity-50"
          >
            <SendIcon />
          </button>
        </div>
        <Field label="To:">
          <span className="rounded-full bg-[#0a84ff]/12 px-2.5 py-0.5 text-[13px] text-[#0a6cf0]">{profile.name}</span>
        </Field>
        <Field label="Name:">
          <input name="name" required maxLength={100} autoComplete="name" className={inputClass} placeholder="Your name" />
        </Field>
        <Field label="From:">
          <input name="email" type="email" required maxLength={200} autoComplete="email" className={inputClass} placeholder="you@example.com" />
        </Field>
        <Field label="Subject:">
          <input name="subject" maxLength={200} className={inputClass} placeholder="What is this about?" />
        </Field>
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <textarea
          name="message"
          required
          maxLength={5000}
          placeholder="Write your message"
          className="min-h-0 flex-1 resize-none bg-transparent px-5 py-3 text-[14px] outline-none placeholder:text-black/30"
        />
        {status.kind !== "idle" && status.kind !== "sending" && (
          <p className={`shrink-0 border-t border-black/10 px-5 py-2 text-xs ${status.kind === "sent" ? "text-[#248a3d]" : "text-[#d70015]"}`} role="status">
            {status.kind === "sent" ? "Message sent. Thank you!" : status.message}
          </p>
        )}
      </form>
    </div>
  );
}
