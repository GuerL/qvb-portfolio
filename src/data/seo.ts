import { profile, projects, type Project } from './portfolio';

// Portfolio URLs always use the public canonical domain, including preview builds.
export const site = { origin: 'https://qvb.dev', image: 'https://qvb.dev/og.png', imageAlt: 'Quentin Van Bever — Software Engineer & Product Builder' };
export const indexableRoutes = ['/', ...projects.map(project => `/projects/${project.slug}`)];
const person = {
  '@type': 'Person', '@id': `${site.origin}/#person`, name: profile.name,
  url: `${site.origin}/`, jobTitle: 'Software Engineer',
  sameAs: [profile.linkedinUrl, profile.githubUrl].filter(Boolean),
};
const projectLabel = (project: Project) => project.id === 'bifrost' ? 'Desktop API Client'
  : project.id === 'scopa' ? 'Multiplayer Card Game'
  : project.id === 'peaks' ? 'Multiplayer TriPeaks Solitaire'
  : project.id === 'family' ? 'Shared Shopping List' : project.category.replace(' · ', ' ');
export function metadata(path: string) {
  path = path.replace(/\/$/, '') || '/';
  const project = projects.find(project => path === `/projects/${project.slug}`);
  const home = path === '/' || path === '/projects';
  const canonical = `${site.origin}${home ? '/' : path}`;
  const title = home ? 'Quentin Van Bever | Software Engineer & Product Builder'
    : project ? `${project.name} — ${projectLabel(project)} | Quentin Van Bever` : 'Page not found | Quentin Van Bever';
  const description = home ? 'Software engineer specializing in Java, Spring Boot, React and full-stack development. Explore Bifrost, Scopa Online, WhateverPeaks and other software projects.'
    : project ? `${project.description} Built with ${project.technologies.join(', ')} by Quentin Van Bever.` : 'This page does not exist. Explore software projects by Quentin Van Bever.';
  const graph = home ? [person, { '@type': 'WebSite', '@id': `${site.origin}/#website`, url: `${site.origin}/`, name: 'Quentin Van Bever', author: { '@id': person['@id'] } }]
    : project ? [{ '@type': 'CreativeWork', '@id': `${canonical}#project`, url: canonical, name: project.name, description: project.description, author: person, keywords: project.technologies.join(', '), image: site.image }] : [];
  // CreativeWork describes the portfolio project without asserting an available software release.
  return { title, description, canonical, noindex: !home && !project, jsonLd: { '@context': 'https://schema.org', '@graph': graph } };
}
export type Metadata = ReturnType<typeof metadata>;
export const serializeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
export function metaEntries(seo: Metadata): [string, string, string][] {
  return [
    ['name', 'description', seo.description], ['name', 'robots', seo.noindex ? 'noindex, follow' : 'index, follow'],
    ['property', 'og:type', 'website'], ['property', 'og:title', seo.title], ['property', 'og:description', seo.description],
    ['property', 'og:url', seo.canonical], ['property', 'og:image', site.image], ['property', 'og:image:alt', site.imageAlt],
    ['property', 'og:image:width', '1200'], ['property', 'og:image:height', '630'],
    ['name', 'twitter:card', 'summary_large_image'], ['name', 'twitter:title', seo.title],
    ['name', 'twitter:description', seo.description], ['name', 'twitter:image', site.image], ['name', 'twitter:image:alt', site.imageAlt],
  ];
}
export function applyMetadata(seo: Metadata) {
  document.title = seo.title;
  for (const [attribute, key, content] of metaEntries(seo)) {
    const element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`) ?? document.head.appendChild(document.createElement('meta'));
    element.setAttribute(attribute, key); element.content = content;
  }
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]') ?? document.head.appendChild(document.createElement('link'));
  canonical.rel = 'canonical'; canonical.href = seo.canonical;
  const data = document.getElementById('seo-jsonld') ?? document.head.appendChild(document.createElement('script'));
  data.id = 'seo-jsonld'; data.setAttribute('type', 'application/ld+json'); data.textContent = serializeJsonLd(seo.jsonLd);
}
