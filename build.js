// Builds a static, SEO-ready, multilingual site into ./dist
// Usage: SITE_URL=https://kontaro.ai [AUTH_MODE=api|app] [APP_URL=https://relay.kontaro.ai] [API_URL=https://relay-whatsapp-api.onrender.com] [LEAD_ENDPOINT=...] node build.js
const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
const SITE=(process.env.SITE_URL||'https://kontaro.ai').replace(/\/$/,'');
const LEAD=process.env.LEAD_ENDPOINT||'';
// api (default): the sign-up/login forms on kontaro.ai talk to the Relay API, then hand the session to the app.
// app (fallback): AUTH_MODE=app node build.js sends people to the Relay app to sign up / log in instead.
const AUTH_MODE=process.env.AUTH_MODE==='app'?'app':'api';
const APP_URL=process.env.APP_URL||'https://relay.kontaro.ai';
const API_URL=process.env.API_URL||'https://relay-whatsapp-api.onrender.com';
// Page URLs per language (must match PAGES / PLAN_SLUG in src/index.html)
const PAGES={pt:{home:'',pricing:'precos/',faq:'duvidas/',signup:'criar-conta/',login:'entrar/',about:'sobre/',contact:'fale-conosco/',plan:'precos/{p}/'},
  en:{home:'en/',pricing:'en/pricing/',faq:'en/faq/',signup:'en/signup/',login:'en/login/',about:'en/about/',contact:'en/contact/',plan:'en/pricing/{p}/'},
  es:{home:'es/',pricing:'es/precios/',faq:'es/preguntas/',signup:'es/crear-cuenta/',login:'es/iniciar-sesion/',about:'es/sobre-nosotros/',contact:'es/contacto/',plan:'es/precios/{p}/'}};
const PLAN_SLUG={pt:{starter:'essencial',growth:'crescimento',scale:'escala'},en:{starter:'starter',growth:'growth',scale:'scale'},es:{starter:'esencial',growth:'crecimiento',scale:'escala'}};
const PAGE_LIST=[{id:'home'},{id:'pricing'},{id:'faq'},{id:'signup'},{id:'login'},{id:'about'},{id:'contact'},{id:'plan',plan:'starter'},{id:'plan',plan:'growth'},{id:'plan',plan:'scale'}];
const dirFor=(c,pg)=>pg.id==='plan'?PAGES[c].plan.replace('{p}',PLAN_SLUG[c][pg.plan]):PAGES[c][pg.id];
const PRELOAD_RE=/<link rel="preload"[^>]*>\s*/g;
const SRC=fs.readFileSync(path.join(__dirname,'src/index.html'),'utf8');
const PRELOADS=(SRC.match(PRELOAD_RE)||[]).join('').replace(/>\s*/g,'>\n'); // moved into <head>
const body=SRC
  .replace(/<title>[\s\S]*?<\/title>\s*/,'').replace(/<meta name="claude:viewport-fit-sides"[^>]*>\s*/,'').replace(/<meta name="description"[^>]*>\s*/,'').replace(PRELOAD_RE,'');
// Plan prices come from PLANS in src/index.html, so the structured data always matches the pricing table.
const PRICES=Object.fromEntries([...SRC.matchAll(/\{id:"(\w+)",\s*brl:(\d+),\s*usd:(\d+)/g)].map(m=>[m[1],{brl:+m[2],usd:+m[3]}]));
if(Object.keys(PRICES).length!==3) throw new Error('Could not read PLANS prices from src/index.html');
// lastmod: date of the last commit that changed these files (falls back to today outside git).
const gitDate=(...files)=>{try{return require('child_process').execSync('git log -1 --format=%cs -- '+files.map(f=>JSON.stringify(f)).join(' '),{cwd:__dirname,stdio:['ignore','pipe','ignore']}).toString().trim()||null;}catch(e){return null;}};
const ROBOTS_INDEX='index, follow, max-image-preview:large, max-snippet:-1';
const NOINDEX=['login','signup']; // thin app pages: kept out of search results and the sitemap
const metaKey=pg=>pg.id==='plan'?'plan_'+pg.plan:pg.id;
const esc=v=>String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const LANGS=[{code:'pt',hl:'pt-BR',dir:'',og:'pt_BR'},{code:'en',hl:'en',dir:'en/',og:'en_US'},{code:'es',hl:'es',dir:'es/',og:'es_LA'}];
const T=JSON.parse(JSON.stringify(require('./i18n-meta.json')));
const OG={pt:{h:'Seu negócio responde no WhatsApp. <em>A qualquer hora.</em>',a:'Oi! Vocês entregam hoje?',b:'Entregamos sim! Pedidos até as 16h saem hoje. Quer repetir o último pedido?',t:'IA no WhatsApp oficial'},
 en:{h:'Your business answers on WhatsApp. <em>Any hour.</em>',a:'Hi! Can you deliver today?',b:'Yes! Orders before 4 p.m. go out today. Want to repeat your last order?',t:'AI on official WhatsApp'},
 es:{h:'Tu negocio responde en WhatsApp. <em>A cualquier hora.</em>',a:'¡Hola! ¿Entregan hoy?',b:'¡Sí! Los pedidos hasta las 4 p. m. salen hoy. ¿Repetimos tu último pedido?',t:'IA en WhatsApp oficial'}};
function ogCard(c){const o=OG[c];return `<html><body style="margin:0"><div style="width:1200px;height:630px;box-sizing:border-box;padding:64px 72px;background:#F3F5FA;background-image:radial-gradient(#DCE1EC 1.5px,transparent 1.5px);background-size:28px 28px;font-family:Inter,system-ui,sans-serif;color:#0C1526;display:grid;grid-template-columns:1.15fr .85fr;gap:48px;align-items:center">
<div><div style="display:flex;align-items:center;gap:14px;font:800 34px system-ui;letter-spacing:-1px"><svg width="46" height="46" viewBox="0 0 32 32"><rect x="1" y="1" width="30" height="30" rx="9" fill="#2F52F5"/><path d="M10 8v16M10 16l8-8M13.5 13.5 21 24" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="23.5" cy="9.5" r="3" fill="#F2672E"/></svg>kontaro</div>
<div style="font:800 64px/1.02 system-ui;letter-spacing:-2px;margin-top:34px">${o.h.replace('<em>','<span style="color:#2F52F5">').replace('</em>','</span>')}</div>
<div style="margin-top:28px;font:600 20px monospace;color:#F2672E;letter-spacing:1px;text-transform:uppercase">● ${o.t}</div></div>
<div style="display:grid;gap:14px;background:#E4E9F3;border-radius:28px;padding:28px;border:10px solid #0C1526">
<div style="background:#fff;border-radius:18px 18px 18px 6px;padding:16px 18px;font-size:22px;max-width:85%">${o.a}</div>
<div style="background:#D9E2FF;border-radius:18px 18px 6px 18px;padding:16px 18px;font-size:22px;justify-self:end;max-width:90%"><div style="font:700 13px monospace;color:#2F52F5;letter-spacing:1px">KONTARO AI</div>${o.b}</div></div></div></body></html>`;}
const ORG={"@type":"Organization","@id":SITE+"/#org","name":"Kontaro","legalName":"Kontaro Inc.","url":SITE+"/",
  "logo":{"@type":"ImageObject","url":SITE+"/blog/og/logo.png","width":512,"height":512},"email":"talk@kontaro.ai",
  "address":{"@type":"PostalAddress","streetAddress":"830 Brickell Plaza","addressLocality":"Miami","addressRegion":"FL","postalCode":"33131","addressCountry":"US"},
  "sameAs":["https://www.instagram.com/kontaro.ai/","https://www.linkedin.com/company/kontaro-ai/"]};
const CRUMB={pt:'Início',en:'Home',es:'Inicio'}, PRICING_NAME={pt:'Preços',en:'Pricing',es:'Precios'};
const PLAN_NAMES=Object.fromEntries(['pt','en','es'].map(l=>{const m=SRC.slice(SRC.indexOf('var PLAN_TXT')).match(new RegExp(l+':\\{starter:\\{n:"([^"]+)"[\\s\\S]*?growth:\\{n:"([^"]+)"[\\s\\S]*?scale:\\{n:"([^"]+)"'));
  if(!m) throw new Error('Could not read plan names for '+l); return [l,{starter:m[1],growth:m[2],scale:m[3]}];}));
// JSON-LD for one page. planNames: {starter:'Essencial',...} read from the rendered page.
function jsonLd(L,pg,url,title,desc,h1,planNames){
  const g=[ORG];
  const cur=L.code==='pt'?'BRL':'USD';
  const offer=id=>{const price=PRICES[id][L.code==='pt'?'brl':'usd'];return {"@type":"Offer","name":planNames[id],"url":`${SITE}/${dirFor(L.code,{id:'plan',plan:id})}`,"price":price,"priceCurrency":cur,
    "priceSpecification":{"@type":"UnitPriceSpecification","price":price,"priceCurrency":cur,"billingDuration":"P1M","unitText":"MONTH"},"availability":"https://schema.org/InStock"};};
  if(pg.id==='home') g.push({"@type":"WebSite","@id":SITE+"/#website","url":SITE+"/","name":"Kontaro","inLanguage":["pt-BR","en","es"],"publisher":{"@id":SITE+"/#org"}});
  g.push({"@type":"WebPage","@id":url+"#webpage","url":url,"name":title,"description":desc,"inLanguage":L.hl,"isPartOf":{"@id":SITE+"/#website"},"about":{"@id":SITE+"/#software"}});
  if(['home','pricing','plan'].includes(pg.id)) g.push({"@type":"SoftwareApplication","@id":SITE+"/#software","name":"Kontaro","applicationCategory":"BusinessApplication","operatingSystem":"Web",
    "url":SITE+"/"+PAGES[L.code].home,"description":T[L.code].home.desc,"publisher":{"@id":SITE+"/#org"},
    "offers":pg.id==='plan'?offer(pg.plan):Object.keys(PRICES).map(offer)});
  if(pg.id!=='home'){
    const items=[{name:CRUMB[L.code],item:`${SITE}/${PAGES[L.code].home}`}];
    if(pg.id==='plan') items.push({name:h1.pricing,item:`${SITE}/${PAGES[L.code].pricing}`});
    items.push({name:pg.id==='plan'?planNames[pg.plan]:h1.page,item:url});
    g.push({"@type":"BreadcrumbList","itemListElement":items.map((x,i)=>({"@type":"ListItem","position":i+1,...x}))});
  }
  return `<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@graph":g}).replace(/</g,'\\u003c')}</script>`;
}
function head(L,pg){
  const url=`${SITE}/${dirFor(L.code,pg)}`, M=T[L.code][metaKey(pg)];
  const alts=LANGS.map(x=>`<link rel="alternate" hreflang="${x.hl}" href="${SITE}/${dirFor(x.code,pg)}">`).join('\n')+`\n<link rel="alternate" hreflang="x-default" href="${SITE}/${dirFor('pt',pg)}">`;
  const seo={lang:L.code,page:pg.id,plan:pg.plan||null,title:M.title,desc:M.desc};
  return `<!doctype html>
<html lang="${L.hl}" data-prerender-lang="${L.code}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(M.title)}</title>
<meta name="description" content="${esc(M.desc)}">
<meta name="robots" content="${NOINDEX.includes(pg.id)?'noindex, follow':ROBOTS_INDEX}">
<link rel="canonical" href="${url}">
${alts}
${PRELOADS}<meta name="theme-color" content="#2F52F5">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Kontaro">
<meta property="og:title" content="${esc(M.title)}">
<meta property="og:description" content="${esc(M.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og-${L.code}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${L.og}">
${LANGS.filter(x=>x!==L).map(x=>`<meta property="og:locale:alternate" content="${x.og}">`).join('\n')}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(M.title)}">
<meta name="twitter:description" content="${esc(M.desc)}">
<meta name="twitter:image" content="${SITE}/og-${L.code}.png">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<script>window.KONTARO_AUTH_MODE=${JSON.stringify(AUTH_MODE)};window.KONTARO_APP_URL=${JSON.stringify(APP_URL)};window.KONTARO_API_URL=${JSON.stringify(API_URL)};window.KONTARO_SEO=${JSON.stringify(seo).replace(/</g,'\\u003c')};${LEAD?`window.KONTARO_LEAD_ENDPOINT=${JSON.stringify(LEAD)};`:''}</script>
</head>
<body>
`;}
(async()=>{
  const dist=path.join(__dirname,'dist'); fs.rmSync(dist,{recursive:true,force:true}); fs.mkdirSync(dist);
  const b=await chromium.launch();
  for(const L of LANGS){
    const p=await b.newPage({viewport:{width:1200,height:630}});
    await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
    await p.setContent(ogCard(L.code)); await p.screenshot({path:path.join(dist,`og-${L.code}.png`)});
    for(const pg of PAGE_LIST){
      const raw=head(L,pg)+body+'\n</body>\n</html>\n';
      const tmp=path.join(dist,`_tmp_${L.code}.html`); fs.writeFileSync(tmp,raw);
      await p.goto('file://'+tmp+'?lang='+L.code+'&page='+pg.id+(pg.plan?'&plan='+pg.plan:'')); await p.waitForTimeout(700);
      // Pre-render translated text for crawlers; clear animated containers (JS refills them).
      const r=await p.evaluate((pid)=>{
        ['#heroChat','#adminChat','#answer','#viz','#asked'].forEach(s=>{const e=document.querySelector(s); if(e) e.innerHTML='';});
        document.querySelectorAll('.float').forEach(f=>f.classList.add('dim'));
        // One <h1> per page: headings inside sections hidden on this page become plain <div>s (same id/class).
        document.querySelectorAll('[data-pages][hidden] h1').forEach(h=>{const d=document.createElement('div');for(const at of h.attributes)d.setAttribute(at.name,at.value);d.innerHTML=h.innerHTML;h.replaceWith(d);});
        if(['home','faq','pricing'].includes(pid)){
          const qa=[...document.querySelectorAll('#faqList details')].map(d=>({"@type":"Question","name":d.querySelector('summary').textContent,"acceptedAnswer":{"@type":"Answer","text":d.querySelector('p').textContent}}));
          const sc=document.createElement('script'); sc.type='application/ld+json'; sc.textContent=JSON.stringify({"@context":"https://schema.org","@type":"FAQPage","mainEntity":qa}); document.head.appendChild(sc);
        }
        const vis=s=>{const e=document.querySelector(s);return e&&!e.closest('[hidden]')?e.textContent.trim():'';};
        return {html:'<!doctype html>\n'+document.documentElement.outerHTML,title:document.title,desc:(document.querySelector('meta[name="description"]')||{}).content||'',
          crumb:vis('#phE')||vis('#auth h1')||document.title};
      },pg.id);
      const M=T[L.code][metaKey(pg)];
      if(r.title!==M.title||r.desc!==M.desc) throw new Error(`Page script changed the title/description of ${dirFor(L.code,pg)}: ${r.title}`);
      const ld=jsonLd(L,pg,`${SITE}/${dirFor(L.code,pg)}`,M.title,M.desc,{pricing:PRICING_NAME[L.code],page:r.crumb},PLAN_NAMES[L.code]);
      let html=r.html.replace('</head>',ld+'\n</head>');
      const out=path.join(dist,dirFor(L.code,pg)); fs.mkdirSync(out,{recursive:true});
      fs.writeFileSync(path.join(out,'index.html'),html); fs.unlinkSync(tmp);
    }
    await p.close();
  }
  await b.close();
  const pub=path.join(__dirname,'public'); if(fs.existsSync(pub)) fs.cpSync(pub,dist,{recursive:true});
  fs.writeFileSync(path.join(dist,'favicon.svg'),'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="1" y="1" width="30" height="30" rx="9" fill="#2F52F5"/><path d="M10 8v16M10 16l8-8M13.5 13.5 21 24" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="23.5" cy="9.5" r="3" fill="#F2672E"/></svg>');
  fs.writeFileSync(path.join(dist,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
  // Icons for browsers and search results (Google shows the favicon next to results; it needs a multiple of 48px).
  {const ic=await chromium.launch(), ip=await ic.newPage(), svg=fs.readFileSync(path.join(dist,'favicon.svg'),'utf8');
   const shot=async n=>{await ip.setViewportSize({width:n,height:n});await ip.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ',`<svg width="${n}" height="${n}" `)}</body></html>`);return ip.screenshot({omitBackground:true});};
   const png48=await shot(48), ico=Buffer.alloc(22); ico.writeUInt16LE(1,2); ico.writeUInt16LE(1,4); ico[6]=48; ico[7]=48; ico.writeUInt16LE(1,10); ico.writeUInt16LE(32,12); ico.writeUInt32LE(png48.length,14); ico.writeUInt32LE(22,18);
   fs.writeFileSync(path.join(dist,'favicon.ico'),Buffer.concat([ico,png48]));
   await ip.setViewportSize({width:180,height:180}); await ip.setContent(`<html><body style="margin:0;background:#2F52F5">${svg.replace('<svg ','<svg width="180" height="180" ')}</body></html>`);
   fs.writeFileSync(path.join(dist,'apple-touch-icon.png'),await ip.screenshot());
   await ic.close();}
  // Sitemap: indexable pages only, with hreflang alternates and real last-modified dates.
  const read=f=>fs.readFileSync(f,'utf8');
  const appDate=gitDate('src/index.html','i18n-meta.json')||new Date().toISOString().slice(0,10);
  const entry=(loc,lastmod,alts)=>`  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod>`+(alts&&alts.length?'\n'+alts.map(([hl,href])=>`    <xhtml:link rel="alternate" hreflang="${hl}" href="${href}"/>`).join('\n')+'\n  ':'')+`</url>`;
  const appEntries=PAGE_LIST.filter(pg=>!NOINDEX.includes(pg.id)).flatMap(pg=>LANGS.map(L=>entry(`${SITE}/${dirFor(L.code,pg)}`,appDate,
    LANGS.map(x=>[x.hl,`${SITE}/${dirFor(x.code,pg)}`]).concat([['x-default',`${SITE}/${dirFor('pt',pg)}`]]))));
  // Hand-written pages in public/: lastmod = dateModified in the page (articles), newest article (blog index), "Last updated" (legal).
  const pubPages=require('child_process').execSync('find '+JSON.stringify(dist)+' -name index.html').toString().trim().split('\n')
    .filter(f=>/\/(blog|terms|privacy)\//.test(f)).sort();
  const months={January:1,February:2,March:3,April:4,May:5,June:6,July:7,August:8,September:9,October:10,November:11,December:12};
  const info=f=>{const h=read(f),loc=SITE+'/'+path.relative(dist,path.dirname(f)).split(path.sep).join('/')+'/';
    const mod=(h.match(/<meta property="article:modified_time" content="(\d{4}-\d\d-\d\d)/)||[])[1];
    const upd=h.match(/Last updated: (\w+) (\d+), (\d{4})/);
    return {f,h,loc,noindex:/<meta name="robots" content="[^"]*noindex/.test(h),
      date:mod||(upd?`${upd[3]}-${String(months[upd[1]]).padStart(2,'0')}-${upd[2].padStart(2,'0')}`:null),
      alts:[...h.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map(m=>[m[1],m[2]])};};
  const pubs=pubPages.map(info).filter(x=>!x.noindex);
  for(const x of pubs) if(!x.date&&/\/blog\/$/.test(x.loc)) x.date=pubs.filter(y=>y.date&&y.loc.startsWith(x.loc)&&y.loc.slice(x.loc.length).split('/').filter(Boolean).length===1).map(y=>y.date).sort().pop();
  for(const x of pubs) if(!x.date) x.date=gitDate(path.relative(__dirname,x.f).replace(/^dist/,'public'))||appDate;
  fs.writeFileSync(path.join(dist,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`+
    appEntries.concat(pubs.map(x=>entry(x.loc,x.date,x.alts))).join('\n')+`\n</urlset>\n`);
  console.log('Built:',fs.readdirSync(dist));
})();
