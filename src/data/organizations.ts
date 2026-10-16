type OrganizationInfo = {
  type: "CollegeOrUniversity" | "Organization" | "GovernmentOrganization" | "Corporation";
  fullName?: string;
  sameAs?: string;
  parent?: { name: string; sameAs: string };
};

export const organizations: Record<string, OrganizationInfo> = {
  "University College London": {
    type: "CollegeOrUniversity",
    sameAs: "https://en.wikipedia.org/wiki/University_College_London",
  },
  "University of Bonn": {
    type: "CollegeOrUniversity",
    sameAs: "https://en.wikipedia.org/wiki/University_of_Bonn",
  },
  "Fraunhofer IOSB": {
    type: "Organization",
    fullName: "Fraunhofer Institute of Optronics, System Technologies and Image Exploitation",
    parent: { name: "Fraunhofer Society", sameAs: "https://en.wikipedia.org/wiki/Fraunhofer_Society" },
  },
  BaFin: {
    type: "GovernmentOrganization",
    fullName: "Federal Financial Supervisory Authority",
    sameAs: "https://en.wikipedia.org/wiki/Federal_Financial_Supervisory_Authority",
  },
  AXA: { type: "Corporation", sameAs: "https://en.wikipedia.org/wiki/AXA" },
  Pakt: { type: "Organization" },
  Cosmoshield: { type: "Organization" },
};
