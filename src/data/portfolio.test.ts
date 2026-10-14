import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projects, publicUrl, emailUrl } from './portfolio';
test('public links reject unsafe protocols and embedded credentials',()=>{for(const value of ['javascript:alert(1)','http://example.com','https://user:secret@example.com','#','/missing']) assert.equal(publicUrl(value),undefined);assert.equal(publicUrl('https://example.com/app'),'https://example.com/app');});
test('email links reject header injection',()=>{assert.equal(emailUrl('hello@example.com'),'mailto:hello@example.com');assert.equal(emailUrl('hello@example.com?subject=spam'),undefined);});
test('project routes are unique and Live projects have a valid live URL',()=>{assert.equal(new Set(projects.map(p=>p.slug)).size,projects.length);for(const p of projects){assert.match(p.slug,/^[a-z0-9-]+$/);if(p.status==='Live')assert.ok(publicUrl(p.liveUrl));for(const url of [p.liveUrl,p.githubUrl,p.downloadUrl])if(url)assert.ok(publicUrl(url));}});
