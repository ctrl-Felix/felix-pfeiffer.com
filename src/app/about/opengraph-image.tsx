import { aboutPage } from "@/data/about";
import { profile } from "@/data/profile";
import { ogCard, ogSize } from "@/lib/ogCard";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Felix Pfeiffer, information security student at UCL";

export default function Image() {
  return ogCard(aboutPage.heading, profile.headline, aboutPage.path);
}
