import type { Metadata } from "next";
import AboutPage from "@/components/about/AboutPage";
import AboutSeo from "@/components/about/AboutSeo";
import VisitTracker from "@/components/VisitTracker";
import { site } from "@/config";
import { aboutPage } from "@/data/about";

export const metadata: Metadata = {
  title: { absolute: aboutPage.title },
  description: aboutPage.description,
  alternates: { canonical: aboutPage.path },
  robots: { index: true, follow: true },
  openGraph: { type: "profile", url: `${site.url}${aboutPage.path}`, siteName: site.name, title: aboutPage.title, description: aboutPage.description, firstName: "Felix", lastName: "Pfeiffer" },
  twitter: { card: "summary_large_image", title: aboutPage.title, description: aboutPage.description },
};

export default function About() {
  return (
    <>
      <AboutSeo />
      <AboutPage />
      <VisitTracker />
    </>
  );
}
