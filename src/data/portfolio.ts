import { base_domain, projectLinks } from './projectLinks';

export type Status = 'Live' | 'In Development' | 'Experimental' | 'Archived';
export interface Screenshot {
  src: string; alt: string; caption?: string; order: number;
  width: number; height: number;
}
export interface Release { version?: string; platforms: string[] }

export interface Project {
  id: string; slug: string; name: string; tagline: string; description: string;
  status: Status; featured: boolean; category: string; technologies: string[];
  features: string[]; screenshots: Screenshot[]; githubUrl?: string; liveUrl?: string; websiteUrl?: string; thumbnail?: Screenshot; release?: Release;
  downloadUrl?: string; technicalHighlights: string[]; deployment: string;
}
// Optional contact fields are hidden when no public destination is configured.
export interface Profile {
  name: string;
  portfolioUrl: string;
  githubUrl?: string;
  linkedinUrl?: string;
  email?: string;
  cvUrl?: string;
}
export const profile: Profile = {
  name: 'Quentin Van Bever',
  portfolioUrl: `https://${base_domain}`,
  githubUrl: 'https://github.com/GuerL',
  linkedinUrl: 'https://www.linkedin.com/in/quentin-van-bever/',
  email: 'vbquentin@gmail.com',
};
const bifrostScreenshots: Screenshot[] = [
  { src:'/images/projects/bifrost/cover.webp', alt:'Bifrost workspace with saved requests, HTTP headers and a successful JSON response', caption:'Overview — requests and responses in one workspace.', order:0, width:3456, height:2050 },
  { src:'/images/projects/bifrost/request-editor.webp', alt:'Bifrost request editor for configuring an HTTP request', caption:'Request Editor — configure an API request.', order:1, width:3456, height:2050 },
  { src:'/images/projects/bifrost/response-viewer.webp', alt:'Bifrost response viewer displaying formatted JSON returned by an API', caption:'Response Viewer — inspect the API response.', order:2, width:3456, height:2050 },
  { src:'/images/projects/bifrost/import.webp', alt:'Bifrost Import from cURL dialog with a POST command, headers and JSON body', caption:'cURL Import — turn a cURL command into a request.', order:3, width:3456, height:2050 },
  { src:'/images/projects/bifrost/environment.webp', alt:'Bifrost request using a baseUrl environment variable with its resolved URL shown in a tooltip', caption:'Environment — reuse variables across requests.', order:4, width:3456, height:2050 },
];
export const projects: Project[] = [
  { ...projectLinks.bifrost, id:'bifrost', slug:'bifrost', name:'Bifrost', tagline:'Your APIs. A better workspace.', category:'Desktop · Developer tools', description:'A desktop API client that brings requests, environments, imports and scripting into one focused workspace.', status:'In Development', featured:true, technologies:['Tauri','Rust','JavaScript'], features:['HTTP request management and multiple body formats','Environment and runtime variables','Import from cURL and OpenAPI / Swagger','Import capabilities for Postman, Bruno and Insomnia','JavaScript scripting','Dark and light themes'], thumbnail:bifrostScreenshots[0], screenshots:bifrostScreenshots, technicalHighlights:['A cross-platform-oriented desktop architecture with Tauri.','Bringing different API collection formats into a consistent request model.','Keeping request configuration, runtime variables and scripting understandable in one workspace.'], deployment:'Public releases and supported platforms have not been confirmed. The download action is disabled until a verified release URL is configured.' },
  { ...projectLinks.scopa, id:'scopa', slug:'scopa-online', name:'Scopa Online', tagline:'A classic game. A shared table.', category:'Web · Multiplayer', description:'The Italian card game, brought online. Create a room, join the table and play together in real time.', status:'In Development', featured:true, technologies:['React','Spring Boot','WebSockets','Docker'],features:['Create and join multiplayer rooms','Real-time gameplay','Responsive mobile interface','Custom Scopa rules'],screenshots:[],technicalHighlights:['Coordinating shared match state between a Spring Boot server and React clients.','Representing custom game rules and room lifecycle in the application.','Designing a card table that works on small touch screens.'],deployment:'A deployed game URL has not been supplied. Public availability and reconnection support need verification before being advertised.' },
  { ...projectLinks.whateverpeaks, id:'peaks', slug:'whateverpeaks', name:'WhateverPeaks', tagline:'Solitaire, with a competitive edge.', category:'Web · Multiplayer',description:'A competitive multiplayer take on TriPeaks Solitaire, with live rooms, timed matches and another round just a rematch away.',status:'In Development',featured:true,technologies:['React','Spring Boot','PostgreSQL','WebSockets','Docker'],features:['Multiplayer rooms and room management','Live competitive gameplay','Countdown and match timers','Rematches'],screenshots:[],technicalHighlights:['Synchronizing live matches and countdowns across connected players.','Managing the transition from room to match to rematch.','Combining a Spring Boot backend, PostgreSQL and a responsive React client.'],deployment:'A public application URL has not been supplied. The visible Play Now action is disabled until a verified live URL is configured.' },
  { ...projectLinks.familylist, id:'family', slug:'familylist', name:'FamilyList', tagline:'One family. One shared list.',category:'Web & Mobile · Everyday tools',description:'A shared shopping-list application for families, connecting family, product and list management across web and mobile.',status:'In Development',featured:false,technologies:['Spring Boot','React','Flutter','WebSockets'],features:['Family management','Shared shopping lists','Product management','Mobile application'],screenshots:[],technicalHighlights:['Sharing application concepts between React and Flutter clients.','Exploring WebSocket-based list synchronization; exact coverage is not yet confirmed.'],deployment:'In development. No public release is currently configured.' },
  { ...projectLinks.echocue, id:'echo', slug:'echocue',name:'EchoCue',tagline:'Exploring sound, beyond the headset.',category:'Desktop · Audio experiment',description:'An experimental desktop audio-overlay project exploring gaming audio through Tauri, Rust and Windows audio APIs.',status:'Experimental',featured:false,technologies:['Tauri','Rust','Windows audio APIs'],features:['Desktop audio-overlay exploration','Windows audio API integration'],screenshots:[],technicalHighlights:['Exploring the boundary between native Windows audio APIs and a Tauri desktop application.','Investigating how audio information can be represented in a gaming overlay.'],deployment:'Experimental. Features and release availability are still being explored.' },
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

// Screenshots are local files with known dimensions, so media never changes layout on load.
export function validScreenshot(image: Screenshot): boolean {
  return /^\/images\/projects\/[a-z0-9-]+\/[a-zA-Z0-9_-]+\.(webp|avif|png|jpe?g)$/.test(image.src)
    && image.alt.trim().length > 0 && Number.isInteger(image.order)
    && Number.isInteger(image.width) && image.width > 0
    && Number.isInteger(image.height) && image.height > 0;
}
export function orderedScreenshots(images: Screenshot[]): Screenshot[] {
  return images.filter(validScreenshot).slice().sort((a,b)=>a.order-b.order);
}
export interface ProjectAction {
  label: string; href?: string; primary: boolean;
  kind: 'live' | 'download' | 'github' | 'website';
  missingMessage?: string;
}
export function projectActions(project: Project): ProjectAction[] {
  const actions: ProjectAction[] = [];
  const add = (kind: ProjectAction['kind'], label: string, url: string | undefined, primary: boolean, configKey?: string) => {
    const href = publicUrl(url);
    if (href || configKey) actions.push({kind,label,href,primary,
      missingMessage: href ? undefined : `${label === 'Download' ? 'Download' : 'Application'} URL needs to be configured (${configKey}).`,
    });
  };
  if (project.id === 'bifrost') add('download','Download',project.downloadUrl,true,'bifrost.downloadUrl');
  else if (project.id === 'scopa' || project.id === 'peaks') {
    add('live','Play Now',project.liveUrl,true,`${project.id === 'scopa' ? 'scopa' : 'whateverpeaks'}.liveUrl`);
  } else if (project.id === 'family') {
    add('live','Open FamilyList',project.liveUrl,true);
    add('download','Download FamilyList',project.downloadUrl,!publicUrl(project.liveUrl));
  }
  add('github','GitHub',project.githubUrl,false);
  add('website','Website',project.websiteUrl,false);
  return actions;
}
