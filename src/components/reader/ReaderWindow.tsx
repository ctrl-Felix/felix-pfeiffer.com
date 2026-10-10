"use client";

import { readme } from "@/data/readme";
import DocumentReader from "./DocumentReader";

export default function ReaderWindow() {
  return <DocumentReader title="README.md" source={readme} />;
}
