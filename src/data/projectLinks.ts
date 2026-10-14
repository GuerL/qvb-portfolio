export interface ProjectLinks {
  liveUrl?: string;
  websiteUrl?: string;
  githubUrl?: string;
  downloadUrl?: string;
}

// Populate with verified public HTTPS destinations, then rebuild/redeploy.
// Empty strings intentionally produce disabled primary actions, never fake links.
export const base_domain = "qvb.dev"
export const projectLinks = {
  scopa: { liveUrl: 'https://scopa.'+ base_domain, githubUrl: ''},
  whateverpeaks: { liveUrl: 'https://whateverpeaks.'+ base_domain, githubUrl: '' },
  bifrost: { downloadUrl: '', githubUrl: '', websiteUrl: '' },
  familylist: { liveUrl: '', downloadUrl: '', githubUrl: '' },
  echocue: { githubUrl: '' },
} satisfies Record<string, ProjectLinks>;
