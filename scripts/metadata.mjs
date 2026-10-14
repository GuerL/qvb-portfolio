import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const base = new URL(process.env.VITE_SITE_URL || 'https://qvb.dev');
if(base.protocol !== 'https:' || base.pathname !== '/' || base.search || base.hash || base.username || base.password) throw new Error('VITE_SITE_URL must be a public HTTPS origin');
const origin = base.origin;
// Keep route/content generation driven by the same TypeScript configuration as the UI.
const projects = JSON.parse(execFileSync(process.execPath,['--import','tsx','--input-type=module','-e',"import {projects} from './src/data/portfolio.ts'; console.log(JSON.stringify(projects))"],{encoding:'utf8'}));
const template = readFileSync('dist/index.html','utf8');
const escape = value => value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function page(path,title,description,noindex=false){const url=origin+path;return template.replace(/<title>.*?<\/title>/,`<title>${escape(title)}</title>`).replace(/<meta name="description" content="[^"]*"\/>/,`<meta name="description" content="${escape(description)}"/>`).replace('</head>',`<link rel="canonical" href="${url}"/><meta property="og:type" content="website"/><meta property="og:title" content="${escape(title)}"/><meta property="og:description" content="${escape(description)}"/><meta property="og:url" content="${url}"/><meta property="og:image" content="${origin}/og.png"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta name="twitter:card" content="summary_large_image"/>${noindex?'<meta name="robots" content="noindex"/>':''}</head>`);}
writeFileSync('dist/index.html',page('/','Quentin Van Bever — Software Engineer & Product Builder','Belgian software engineer building full-stack applications, desktop tools and self-hosted products.'));
for(const p of projects){mkdirSync(`dist/projects/${p.slug}`,{recursive:true});writeFileSync(`dist/projects/${p.slug}/index.html`,page(`/projects/${p.slug}`,`${p.name} — Quentin Van Bever`,p.description));}
writeFileSync('dist/404.html',page('/404','Page not found — Quentin Van Bever','This page does not exist.',true));
writeFileSync('dist/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
writeFileSync('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/',...projects.map(p=>`/projects/${p.slug}`)].map(path=>`<url><loc>${origin}${path}</loc></url>`).join('')}</urlset>`);
