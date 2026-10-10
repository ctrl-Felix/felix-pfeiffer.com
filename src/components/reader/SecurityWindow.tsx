"use client";

import { security } from "@/data/security";
import DocumentReader from "./DocumentReader";

export default function SecurityWindow() {
  return <DocumentReader title="Security.md" source={security} />;
}
