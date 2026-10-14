import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { projects, publicUrl, emailUrl, validScreenshot } from './portfolio';
test('public links reject unsafe protocols and embedded credentials',()=>{for(const value of ['javascript:alert(1)','http://example.com','https://user:secret@example.com','#','/missing']) assert.equal(publicUrl(value),undefined);assert.equal(publicUrl('https://example.com/app'),'https://example.com/app');});
test('email links reject header injection',()=>{assert.equal(emailUrl('hello@example.com'),'mailto:hello@example.com');assert.equal(emailUrl('hello@example.com?subject=spam'),undefined);});
test('project routes are unique and Live projects have a valid live URL',()=>{assert.equal(new Set(projects.map(p=>p.slug)).size,projects.length);for(const p of projects){assert.match(p.slug,/^[a-z0-9-]+$/);if(p.status==='Live')assert.ok(publicUrl(p.liveUrl));for(const url of [p.liveUrl,p.githubUrl,p.downloadUrl])if(url)assert.ok(publicUrl(url));}});

test('project-specific CTA labels and priorities match their distribution model', async()=>{
  const {projectActions}=await import('./portfolio');
  const base={...projects[0],liveUrl:'https://example.com/play',downloadUrl:'https://example.com/download',githubUrl:'https://example.com/repo',websiteUrl:'https://example.com/product'};
  assert.deepEqual(projectActions(base).map(a=>a.label),['Download','GitHub','Website']);
  for(const id of ['scopa','peaks']) assert.equal(projectActions({...base,id})[0].label,'Play Now');
  assert.equal(projectActions({...base,id:'echo'}).some(a=>a.primary),false);
  assert.equal(projectActions({...projects[3],liveUrl:undefined,downloadUrl:undefined}).length,0);
  assert.equal(projectActions({...base,downloadUrl:'javascript:alert(1)',githubUrl:undefined,websiteUrl:undefined})[0].href,undefined);
});
test('gallery accepts local assets with dimensions and stable display ordering',async()=>{
  const {validScreenshot,orderedScreenshots}=await import('./portfolio');
  const first={src:'/images/projects/bifrost/requests.webp',alt:'Request workspace',width:1440,height:900,order:0};
  const second={...first,src:'/images/projects/bifrost/import.avif',order:1};
  assert.ok(validScreenshot(first));
  for(const patch of [{src:'https://example.com/remote.webp'},{src:'/images/projects/bifrost/../secret.webp'},{width:0},{alt:''}])assert.equal(validScreenshot({...first,...patch}),false);
  assert.deepEqual(orderedScreenshots([second,first]),[first,second]);
});

test('configured screenshots and thumbnails exist locally and have valid metadata',()=>{
  for(const project of projects) for(const image of [...project.screenshots,...(project.thumbnail?[project.thumbnail]:[])]){
    assert.ok(validScreenshot(image),`Invalid media for ${project.name}`);
    assert.ok(existsSync(`public${image.src}`),`Missing asset: ${image.src}`);
  }
});

test('unconfigured primary actions remain visible and consume explicit link configuration',async()=>{
  const {projectActions}=await import('./portfolio');
  const {projectLinks}=await import('./projectLinks');
  for(const [id,key,label] of [['scopa','scopa','Play Now'],['peaks','whateverpeaks','Play Now'],['bifrost','bifrost','Download']] as const){
    const project=projects.find(p=>p.id===id)!;
    assert.equal(project.id==='bifrost'?project.downloadUrl:project.liveUrl,project.id==='bifrost'?projectLinks.bifrost.downloadUrl:projectLinks[key as 'scopa'|'whateverpeaks'].liveUrl);
    const action=projectActions({...project,liveUrl:'',downloadUrl:''})[0];
    assert.equal(action.label,label);assert.equal(action.href,undefined);assert.ok(action.missingMessage);
    assert.equal(projectActions({...project,githubUrl:''}).some(a=>a.kind==='github'),false);
  }
});
