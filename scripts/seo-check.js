// SEO + rendering checks for the built site in dist/.
// Usage: node scripts/seo-check.js [--render]   (run `node build.js` first)
//   Static checks (always): every sitemap URL exists and is self-canonical and indexable, titles and
//   descriptions (length, duplicates), html lang / og:locale / hreflang agree, x-default rule, og:image
//   exists and is 1200x630, JSON-LD parses, blog posts are linked from a listing and from 2+ posts,
//   internal links point to pages that exist, images have width/height.
//   --render: also opens every page in Chromium at 1280px and 390px and reports console errors and
//   horizontal overflow (needs Playwright).
const fs=require('fs'),path=require('path');
const DIST=path.join(__dirname,'..','dist'),SITE='https://kontaro.ai';
const LOCALE={'pt-BR':'pt_BR',en:'en_US',es:'es_LA'};
const problems=[],warn=(u,m)=>problems.push(u+'  '+m);
const read=f=>fs.readFileSync(f,'utf8');
const fileFor=u=>{const p=u.replace(SITE,'').split('#')[0].split('?')[0];const f=path.join(DIST,p);return fs.existsSync(f)&&fs.statSync(f).isDirectory()?path.join(f,'index.html'):f;};
const attr=(html,re)=>{const m=html.match(re);return m?m[1]:null;};
const decode=s=>s&&s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#x27;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
function imgSize(f){const b=fs.readFileSync(f);
  if(b[0]===0x89) return [b.readUInt32BE(16),b.readUInt32BE(20)];
  if(b[0]===0xff){let i=2;while(i<b.length){const m=b[i+1],l=b.readUInt16BE(i+2);if(m>=0xc0&&m<=0xc3)return [b.readUInt16BE(i+7),b.readUInt16BE(i+5)];i+=2+l;}}
  if(b.toString('ascii',8,12)==='WEBP'){const t=b.toString('ascii',12,16);if(t==='VP8X')return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(t==='VP8 ')return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];if(t==='VP8L'){const v=b.readUInt32LE(21);return [(v&0x3fff)+1,((v>>14)&0x3fff)+1];}}
  return null;}

const sitemap=read(path.join(DIST,'sitemap.xml'));
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const allHtml=require('child_process').execSync(`find "${DIST}" -name index.html`).toString().trim().split('\n');
const pageUrl=f=>SITE+'/'+path.relative(DIST,path.dirname(f)).split(path.sep).join('/')+(path.dirname(f)===DIST?'':'/');
const titles={},descs={},inbound={},pages={};
for(const f of allHtml){
  const u=pageUrl(f).replace(/\/\/$/,'/'),h=read(f);pages[u]=h;
  const robots=attr(h,/<meta name="robots" content="([^"]*)"/)||'';
  const noindex=/noindex/.test(robots), inMap=urls.includes(u);
  if(noindex&&inMap) warn(u,'noindex page is listed in the sitemap');
  if(!noindex&&!inMap) warn(u,'indexable page missing from sitemap');
  const canon=attr(h,/<link rel="canonical" href="([^"]+)"/);
  if(!noindex&&canon!==u) warn(u,'canonical is '+canon);
  const title=decode(attr(h,/<title>([^<]*)<\/title>/)),desc=decode(attr(h,/<meta name="description" content="([^"]*)"/));
  if(!title) warn(u,'no <title>'); else { if(title.length>60) warn(u,`title ${title.length} chars: ${title}`); if(!noindex)(titles[title]=titles[title]||[]).push(u); }
  if(!desc) warn(u,'no meta description'); else { if(desc.length<120||desc.length>160) warn(u,`description ${desc.length} chars`); if(!noindex)(descs[desc]=descs[desc]||[]).push(u); }
  const lang=attr(h,/<html[^>]* lang="([^"]+)"/),loc=attr(h,/<meta property="og:locale" content="([^"]+)"/);
  if(LOCALE[lang]!==loc) warn(u,`html lang ${lang} vs og:locale ${loc}`);
  if(!noindex){
    const alts=[...h.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(m=>[m[1],m[2]]);
    if(alts.length){
      const self=alts.find(a=>a[1]===u); if(!self) warn(u,'hreflang set does not include the page itself'); else if(self[0]!==lang) warn(u,`hreflang ${self[0]} != html lang ${lang}`);
      const xd=alts.find(a=>a[0]==='x-default'),pt=alts.find(a=>a[0]==='pt-BR');
      if(!xd) warn(u,'no x-default'); else if(pt&&xd[1]!==pt[1]) warn(u,'x-default is not the pt-BR page');
      for(const [,href] of alts) if(!fs.existsSync(fileFor(href))) warn(u,'hreflang target missing: '+href);
    }
    {const n=(h.match(/<h1[\s>]/g)||[]).length; if(n!==1) warn(u,n+" <h1> elements");}
  }
  for(const p of ['og:title','og:description','og:image','og:url']) if(!new RegExp(`<meta property="${p}" content="[^"]+"`).test(h)) warn(u,'missing '+p);
  const og=attr(h,/<meta property="og:image" content="([^"]+)"/);
  if(og){const of=fileFor(og); if(!fs.existsSync(of)) warn(u,'og:image missing: '+og); else {const s=imgSize(of); if(!s||s[0]!==1200||s[1]!==630) warn(u,'og:image is '+(s||['?']).join('x'));}}
  for(const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){
    let j; try{j=JSON.parse(m[1]);}catch(e){warn(u,'invalid JSON-LD: '+e.message);continue;}
    const s=JSON.stringify(j); if(/aggregateRating|"Review"/.test(s)) warn(u,'JSON-LD has ratings/reviews');
    if(/"FAQPage"/.test(s)){const nodes=(j['@graph']||[j]).filter(n=>n['@type']==='FAQPage');for(const n of nodes)for(const q of n.mainEntity){const nm=q.name.slice(0,40);if(!decode(h.replace(/<script[\s\S]*?<\/script>/g,'')).includes(nm)) warn(u,'FAQ question not visible on page: '+nm);}}
  }
  for(const m of h.matchAll(/<img\b[^>]*>/g)) if(!/width=/.test(m[0])||!/height=/.test(m[0])) warn(u,'img without width/height: '+m[0].slice(0,80));
  for(const m of h.replace(/<script[\s\S]*?<\/script>/g,'').matchAll(/<a\b[^>]*href="([^"#?]*)[^"]*"/g)){
    let href=m[1]; if(!href||/^(mailto|tel|javascript):/.test(href)) continue;
    if(/^https?:/.test(href)){ if(!href.startsWith(SITE)) continue; } else if(!href.startsWith('/')) continue; else href=SITE+href;
    const target=href.endsWith('/')||/\.[a-z0-9]+$/i.test(href)?href:href+'/';
    if(!fs.existsSync(fileFor(target))) warn(u,'broken internal link: '+m[1]);
    if(target!==u) (inbound[target]=inbound[target]||new Set()).add(u);
  }
}
for(const u of urls) if(!pages[u]&&!fs.existsSync(fileFor(u))) warn(u,'sitemap URL has no file');
for(const [t,us] of Object.entries(titles)) if(us.length>1) warn(us.join(', '),'duplicate title: '+t);
for(const [d,us] of Object.entries(descs)) if(us.length>1) warn(us.join(', '),'duplicate description: '+d.slice(0,50));
const isPost=u=>/\/blog\/[^/]+\/$/.test(u)&&!/\/blog\/(assets|og)\//.test(u);
const isHub=u=>/\/blog\/$/.test(u);
for(const u of Object.keys(pages).filter(isPost)){
  const from=[...(inbound[u]||[])];
  if(!from.some(isHub)) warn(u,'blog post not linked from its blog index');
  if(from.filter(isPost).length<2) warn(u,`blog post linked from only ${from.filter(isPost).length} other post(s)`);
  const h=pages[u];
  if(!/href="\/(precos|en\/pricing|es\/precios)\/#billing"/.test(h)) warn(u,'no contextual link to the cost calculator');
}
if(!fs.existsSync(path.join(DIST,'404.html'))) warn('/404.html','no custom 404 page');

(async()=>{
  if(process.argv.includes('--render')){
    const {chromium}=require('playwright'),http=require('child_process').spawn(process.execPath,[path.join(__dirname,'serve.js'),'8091']);
    await new Promise(r=>setTimeout(r,600)); const b=await chromium.launch();
    for(const vp of [{width:1280,height:900},{width:390,height:844}]){
      const ctx=await b.newContext({viewport:vp}); await ctx.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
      for(const u of Object.keys(pages)){
        const p=await ctx.newPage(),errs=[]; p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|net::/.test(m.text()))errs.push(m.text())}); p.on('pageerror',e=>errs.push(e.message));
        const res=await p.goto(u.replace(SITE,'http://localhost:8091')+'?lang=stay',{waitUntil:'load'}); await p.waitForTimeout(250);
        const ov=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
        if(res.status()!==200) warn(u,'HTTP '+res.status());
        if(ov>0) warn(u,`${vp.width}px: horizontal overflow ${ov}px`);
        if(errs.length) warn(u,`${vp.width}px: console errors: `+errs.join(' | ').slice(0,200));
        await p.close();
      }
      await ctx.close();
    }
    const r404=await (await fetch('http://localhost:8091/this-page-does-not-exist/')).status; if(r404!==404) warn('/this-page-does-not-exist/','status '+r404);
    await b.close(); http.kill();
  }
  console.log(`${Object.keys(pages).length} pages, ${urls.length} sitemap URLs, ${problems.length} problem(s)`);
  problems.forEach(p=>console.log(' - '+p));
  process.exitCode=problems.length?1:0;
})();
