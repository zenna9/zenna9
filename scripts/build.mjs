import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe = s => /^(https?:\/\/|mailto:|\/|#)/i.test(s || '') && !String(s).startsWith('//') ? esc(s) : '#';
marked.use({renderer:{html: token => esc(token.text), link: function(token){return `<a href="${safe(token.href)}">${this.parser.parseInline(token.tokens)}</a>`;}, image: token => `<img src="${safe(token.href)}" alt="${esc(token.text)}" loading="lazy">`}});
function parse(text){
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  const data = {};
  if(match) for(const line of match[1].split(/\r?\n/)){const at=line.indexOf(':');if(at>0)data[line.slice(0,at).trim()]=line.slice(at+1).trim();}
  return {data,body: match ? text.slice(match[0].length) : text};
}
const names = {'경력 요약':['overview','A LITTLE ABOUT MY WORK'],경력:['experience','EXPERIENCE'],'기술 스택':['skills','TOOLKIT'],'교육 및 기타사항':['education','LEARNING & BEYOND']};
const sectionSplit = text => [...text.matchAll(/^## (.+)\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)].map(x=>({title:x[1],body:x[2]}));
const entries = text => [...text.matchAll(/^### (.+)\r?\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)].map(x=>({title:x[1],body:x[2]}));
async function buildPage(contentDir, outputDir, variant=''){
  const resume = parse(await fs.readFile(path.join(contentDir,'resume.md'),'utf8'));
  const d=resume.data, sections=sectionSplit(resume.body);
  const projectFiles=(await fs.readdir(path.join(contentDir,'projects'))).filter(f=>f.endsWith('.md'));
  const projects=await Promise.all(projectFiles.map(async f=>({...parse(await fs.readFile(path.join(contentDir,'projects',f),'utf8')),slug:path.basename(f,'.md')})));
  projects.sort((a,b)=>(Number(a.data.order)||99)-(Number(b.data.order)||99)||a.slug.localeCompare(b.slug));
  const template=await fs.readFile(path.join(root,'index.html'),'utf8');
  const render=(title,description,body)=>template.replace(/\{\{(\w+)\}\}/g,(_,key)=>({title:esc(title),description:esc(description),body,email:esc(d.email),name:esc(d.name),year:new Date().getFullYear()}[key]??''));
  await fs.mkdir(outputDir,{recursive:true});
  const links=`<a href="${safe(d.github)}" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="${safe(d.blog)}" target="_blank" rel="noopener noreferrer">Blog ↗</a><a href="${safe(d.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>`;
  const heading=(number,title,label)=>`<div class="section-heading"><div><span class="eyebrow">${esc(label)}</span><h2>${esc(title)}</h2></div><span class="section-number">${number}</span></div>`;
  let counter=0;
  const nav=[];
  function renderSection(section){
    const [id,label]=names[section.title]||[`section-${counter+1}`,'MORE'];
    const num=String(++counter).padStart(2,'0');nav.push({id,title:section.title,num});
    let body;
    if(id==='overview') body=`<div class="overview-grid">${entries(section.body).map((e,i)=>`<article><span class="mini-symbol">${['↳','⌘','↗'][i%3]}</span><h3>${esc(e.title)}</h3>${marked.parse(e.body)}</article>`).join('')}</div>`;
    else if(id==='skills') body=`<div class="skills-grid">${entries(section.body).map(e=>`<article><h3>${esc(e.title)}</h3>${marked.parse(e.body)}</article>`).join('')}</div>`;
    else if(id==='experience'||id==='education') body=`<div class="${id}-list">${entries(section.body).map(e=>{const meta=e.body.match(/^> (.+)$/m);return `<article class="timeline-entry"><div class="entry-heading"><h3>${esc(e.title)}</h3>${meta?`<p class="entry-meta">${esc(meta[1])}</p>`:''}</div><div class="prose">${marked.parse(meta?e.body.replace(meta[0],''):e.body)}</div></article>`;}).join('')}</div>`;
    else body=`<div class="prose">${marked.parse(section.body)}</div>`;
    return `<section id="${id}" class="resume-section">${heading(num,section.title,label)}${body}</section>`;
  }
  const leading=['경력 요약','기술 스택','경력'];
  let bodySections=leading.flatMap(title=>sections.filter(s=>s.title===title)).map(renderSection).join('');
  bodySections+=sections.filter(s=>!['소개','교육 및 기타사항',...leading].includes(s.title)).map(renderSection).join('');
  if(projects.length){
    const num=String(++counter).padStart(2,'0');nav.push({id:'projects',title:'주요 프로젝트',num});
    bodySections+=`<section id="projects" class="resume-section">${heading(num,'주요 프로젝트','SELECTED WORK')}<p class="section-intro">문제를 이해하고, 구조를 바꾸고, 경험을 개선한 기록입니다.</p><div class="project-list">${projects.map((p,i)=>{
      const tokens=marked.lexer(p.body);
      for(const token of tokens) if(token.type==='heading') token.depth=Math.min(6,token.depth+2);
      return `<article class="project-expanded" id="project-${esc(p.slug)}"><header class="project-text-heading"><div class="project-title-row"><h3>${esc(p.data.title)}</h3><span class="small-label">${esc(p.data.period)}</span></div><p class="project-subtitle">${esc(p.data.subtitle)}</p><p class="project-role">${esc(p.data.role)}</p><div class="tags">${(p.data.stack||'').split(',').filter(Boolean).map(t=>`<span>${esc(t.trim())}</span>`).join('')}</div></header><div class="project-body prose">${marked.parser(tokens)}</div></article>`;
    }).join('')}</div></section>`;
  }
  bodySections+=sections.filter(s=>s.title==='교육 및 기타사항').map(renderSection).join('');
  const intro=sections.find(s=>s.title==='소개');
  const hero=`<section class="hero" id="top"><div class="hero-topline"><span class="eyebrow">PORTFOLIO & RESUME</span><span class="hero-location"><span class="status-dot"></span> BASED IN SEOUL</span></div><h1>${esc(d.headline).replace(/&lt;br&gt;/g,'<br>')}</h1><div class="hero-bottom"><div><p class="hero-name">${esc(d.name)}<span>${esc(d.role)}</span></p><div class="hero-description">${intro?marked.parse(intro.body):''}</div><div class="hero-actions"><a class="button primary" href="#projects">프로젝트 살펴보기 <span>↗</span></a></div><div class="document-actions"><button class="button print-button" type="button">인쇄 / PDF 저장 ↓</button><a class="button download-button" href="/resume-portfolio.html" download="정채은-이력서-포트폴리오.html">파일 다운로드 (.html) ↓</a><p>PDF는 인쇄 창에서 ‘PDF로 저장’을 선택하세요.</p></div><div class="mobile-links">${links}</div></div></div></section>`;
  let html=render(`${d.name} · Developer Portfolio`,'복잡한 흐름을 이해하는 개발자 정채은의 이력서와 포트폴리오',`<div class="page">${hero}<div class="content-layout"><aside class="sidebar"><p class="eyebrow">ON THIS PAGE</p><nav aria-label="섹션 이동">${nav.map(n=>`<a href="#${n.id}"><span>${n.num}</span>${esc(n.title)}</a>`).join('')}</nav><div class="sidebar-bottom"><span class="small-label">ELSEWHERE</span>${links}<button class="print-button" type="button">이력서 인쇄 ↗</button></div></aside><main id="main">${bodySections}<section class="contact" id="contact"><span class="eyebrow">LET’S CONNECT</span><h2>더 나은 경험을 만드는 일,<br>함께 이야기해요.</h2><a href="mailto:${esc(d.email)}">${esc(d.email)} <span>↗</span></a></section></main></div></div>`);
  if(variant){
    html=html.replaceAll('href="/#','href="/hae/#').replace('href="/"','href="/hae/"')
      .replace('href="/resume-portfolio.html"','href="/hae/resume-portfolio.html"')
      .replace('download="정채은-이력서-포트폴리오.html"','download="정채은-현대오토에버-이력서.html"')
      .replaceAll('정채은 · Developer Portfolio','정채은 · 현대오토에버 지원 이력서')
      .replaceAll('복잡한 흐름을 이해하는 개발자 정채은의 이력서와 포트폴리오','데이터 시각화, 웹 성능 개선, FE TDD 도입 경험을 담은 정채은의 이력서')
      .replace('PORTFOLIO & RESUME','HYUNDAI AUTOEVER · FRONTEND')
      .replace('</head>','<style>@media print{@page{size:A4;margin:24.5mm 15mm}}</style></head>');
  }
  await fs.writeFile(path.join(outputDir,'index.html'),html);
  const css=await fs.readFile(path.join(root,'public/style.css'),'utf8');
  const js=await fs.readFile(path.join(root,'public/app.js'),'utf8');
  const standalone=html.replace('<link rel="stylesheet" href="/style.css">',()=>`<style>${css}</style>`)
    .replace('<script src="/app.js" defer></script>','')
    .replace('</body>',()=>`<script>${js}</script></body>`)
    .replace('<link rel="icon" href="/favicon.svg" type="image/svg+xml">','')
    .replaceAll('href="/hae/#','href="#').replace('href="/hae/"','href="#top"')
    .replaceAll('href="/#','href="#').replace('href="/"','href="#top"')
    .replace(/<a class="button download-button"[^>]*>.*?<\/a>/g,'');
  await fs.writeFile(path.join(outputDir,'resume-portfolio.html'),standalone);
  console.log(`Built single-page resume with ${projects.length} inline projects + downloadable HTML → ${variant || "/"}`);
}
export async function build(){
  await fs.rm(path.join(root,'dist'),{recursive:true,force:true});
  await fs.mkdir(path.join(root,'dist'),{recursive:true});
  await fs.cp(path.join(root,'public'),path.join(root,'dist'),{recursive:true});
  await buildPage(path.join(root,'content'),path.join(root,'dist'));
  await buildPage(path.join(root,'content/hae'),path.join(root,'dist/hae'),'hae');
}
if(process.argv[1]===fileURLToPath(import.meta.url)) await build();
