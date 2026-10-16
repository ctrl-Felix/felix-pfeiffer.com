import type { Metadata } from "next";
import AboutPage from "@/components/about/AboutPage";
import AboutSeo from "@/components/about/AboutSeo";
import VisitTracker from "@/components/VisitTracker";
import { aboutPage } from "@/data/about";
import { pageMetadata } from "@/lib/pageMetadata";

export const metadata: Metadata = pageMetadata(aboutPage, { type: "profile", firstName: "Felix", lastName: "Pfeiffer" });

export default function About() {
  return (
    <>
      <AboutSeo />
      <AboutPage />
      <VisitTracker />
    </>
  );
}
