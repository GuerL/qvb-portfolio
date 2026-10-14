export type Status = 'Live' | 'In Development' | 'Experimental' | 'Archived';
export interface Screenshot { src: string; alt: string }
export interface Project {
  id: string; slug: string; title: string; tagline: string; description: string;
  status: Status; featured: boolean; category: string; technologies: string[];
  features: string[]; screenshots: Screenshot[]; githubUrl?: string; liveUrl?: string;
  downloadUrl?: string; technicalHighlights: string[]; deployment: string;
}
// Only add verified, public links. Undefined links are omitted from the UI.
export const profile = {
  name: 'Quentin Van Bever', githubUrl: undefined as string | undefined,
  linkedinUrl: undefined as string | undefined, email: undefined as string | undefined,
  cvUrl: undefined as string | undefined,
};
export const projects: Project[] = [
  { id:'bifrost', slug:'bifrost', title:'Bifrost', tagline:'Your APIs. A better workspace.', category:'Desktop · Developer tools', description:'A desktop API client that brings requests, environments, imports and scripting into one focused workspace.', status:'In Development', featured:true, technologies:['Tauri','Rust','JavaScript'], features:['HTTP request management and multiple body formats','Environment and runtime variables','Import from cURL and OpenAPI / Swagger','Import capabilities for Postman, Bruno and Insomnia','JavaScript scripting','Dark and light themes'], screenshots:[], technicalHighlights:['A cross-platform-oriented desktop architecture with Tauri.','Bringing different API collection formats into a consistent request model.','Keeping request configuration, runtime variables and scripting understandable in one workspace.'], deployment:'Public releases and supported platforms have not been confirmed. Download links will appear here when configured.' },
  { id:'scopa', slug:'scopa-online', title:'Scopa Online', tagline:'A classic game. A shared table.', category:'Web · Multiplayer', description:'The Italian card game, brought online. Create a room, join the table and play together in real time.', status:'In Development', featured:true, technologies:['React','Spring Boot','WebSockets','Docker'],features:['Create and join multiplayer rooms','Real-time gameplay','Responsive mobile interface','Custom Scopa rules'],screenshots:[],technicalHighlights:['Coordinating shared match state between a Spring Boot server and React clients.','Representing custom game rules and room lifecycle in the application.','Designing a card table that works on small touch screens.'],deployment:'A deployed game URL has not been supplied. Public availability and reconnection support need verification before being advertised.' },
  { id:'peaks', slug:'whateverpeaks', title:'WhateverPeaks', tagline:'Solitaire, with a competitive edge.', category:'Web · Multiplayer',description:'A competitive multiplayer take on TriPeaks Solitaire, with live rooms, timed matches and another round just a rematch away.',status:'In Development',featured:true,technologies:['React','Spring Boot','PostgreSQL','WebSockets','Docker'],features:['Multiplayer rooms and room management','Live competitive gameplay','Countdown and match timers','Rematches'],screenshots:[],technicalHighlights:['Synchronizing live matches and countdowns across connected players.','Managing the transition from room to match to rematch.','Combining a Spring Boot backend, PostgreSQL and a responsive React client.'],deployment:'A public application URL has not been supplied. Play Now becomes available when a verified live URL is configured.' },
  { id:'family', slug:'familylist', title:'FamilyList', tagline:'One family. One shared list.',category:'Web & Mobile · Everyday tools',description:'A shared shopping-list application for families, connecting family, product and list management across web and mobile.',status:'In Development',featured:false,technologies:['Spring Boot','React','Flutter','WebSockets'],features:['Family management','Shared shopping lists','Product management','Mobile application'],screenshots:[],technicalHighlights:['Sharing application concepts between React and Flutter clients.','Exploring WebSocket-based list synchronization; exact coverage is not yet confirmed.'],deployment:'In development. No public release is currently configured.' },
  { id:'echo', slug:'echocue',title:'EchoCue',tagline:'Exploring sound, beyond the headset.',category:'Desktop · Audio experiment',description:'An experimental desktop audio-overlay project exploring gaming audio through Tauri, Rust and Windows audio APIs.',status:'Experimental',featured:false,technologies:['Tauri','Rust','Windows audio APIs'],features:['Desktop audio-overlay exploration','Windows audio API integration'],screenshots:[],technicalHighlights:['Exploring the boundary between native Windows audio APIs and a Tauri desktop application.','Investigating how audio information can be represented in a gaming overlay.'],deployment:'Experimental. Features and release availability are still being explored.' },
];
export const skillGroups = [
  {title:'Frontend',items:['React','TypeScript','JavaScript','HTML & CSS']},
  {title:'Backend',items:['Java 21+','Spring Boot','REST APIs','WebSockets']},
  {title:'Desktop & Mobile',items:['Tauri','Rust','Flutter']},
  {title:'DevOps & Infrastructure',items:['Docker / Compose','Linux','Proxmox','Cloudflare Tunnel','GitHub Actions']},
  {title:'Databases & Tools',items:['PostgreSQL','MySQL','Git','Scrum']},
];
export function publicUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined; } catch { return undefined; }
}
export function emailUrl(value: string | undefined): string | undefined {
  return value && /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(value) ? `mailto:${value}` : undefined;
}
