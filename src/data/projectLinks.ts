export interface ProjectLinks {
  betaUrl?: string;
  liveUrl?: string;
  websiteUrl?: string;
  githubUrl?: string;
  downloadUrl?: string;
}
export const base_domain = "qvb.dev";

export const projectLinks = {
  gryd: { betaUrl: "https://testflight.apple.com/join/nHgBya72" },
  scopa: {
    liveUrl: `https://scopa.${base_domain}`,
    githubUrl: "",
  },
  whateverpeaks: {
    liveUrl: `https://whateverpeaks.${base_domain}`,
    githubUrl: "",
  },
  bifrost: {
    downloadUrl: "https://github.com/GuerL/bifrost/releases/latest",
    githubUrl: "https://github.com/GuerL/bifrost",
    websiteUrl: "",
  },
  familylist: {
    liveUrl: "",
    downloadUrl: "",
    githubUrl: "",
  },
  echocue: {
    githubUrl: "",
  },
} satisfies Record<string, ProjectLinks>;