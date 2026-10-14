import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projects } from './portfolio';
import { indexableRoutes, metadata, metaEntries, serializeJsonLd } from './seo';

test('canonical indexable routes follow project configuration without aliases or duplicates', () => {
  assert.deepEqual(indexableRoutes, ['/', ...projects.map(project => `/projects/${project.slug}`)]);
  assert.equal(new Set(indexableRoutes).size, indexableRoutes.length);
  assert.equal(metadata('/projects/').canonical, 'https://qvb.dev/');
  assert.equal(metadata('/missing').noindex, true);
});
test('each indexable page has unique metadata and complete sharing tags', () => {
  const pages = indexableRoutes.map(metadata);
  assert.equal(new Set(pages.map(page => page.title)).size, pages.length);
  assert.equal(new Set(pages.map(page => page.description)).size, pages.length);
  for (const page of pages) {
    assert.equal(page.noindex, false);
    const tags = Object.fromEntries(metaEntries(page).map(([, key, value]) => [key, value]));
    assert.equal(tags['og:url'], page.canonical);
    assert.equal(tags['twitter:title'], page.title);
    assert.equal(tags['og:description'], page.description);
    assert.equal(tags['twitter:description'], page.description);
    assert.equal(tags['og:image'], 'https://qvb.dev/og.png');
    assert.equal(tags['twitter:image'], tags['og:image']);
    assert.equal(tags['twitter:card'], 'summary_large_image');
    assert.equal(JSON.parse(serializeJsonLd(page.jsonLd))['@context'], 'https://schema.org');
  }
});
test('structured data uses verified profiles and does not claim public software releases', () => {
  const person = metadata('/').jsonLd['@graph'][0];
  assert.equal(person['@type'], 'Person');
  assert.match(JSON.stringify(person), /https:\/\/github.com\/GuerL/);
  for (const project of projects) {
    const graph = metadata(`/projects/${project.slug}`).jsonLd['@graph'];
    assert.equal(graph[0]['@type'], 'CreativeWork');
    for (const key of ['offers', 'aggregateRating', 'review']) assert.equal(key in graph[0], false);
  }
  assert.equal(serializeJsonLd({ name: '</script>' }).includes('</script>'), false);
});
