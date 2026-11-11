// Builds a static, SEO-ready, multilingual site into ./dist
// Usage: SITE_URL=https://kontaro.ai APP_SIGNUP_URL=https://relay.kontaro.ai/signup [LEAD_ENDPOINT=...] node build.js
const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
const SITE=(process.env.SITE_URL||'https://kontaro.ai').replace(/\/$/,'');
const LEAD=process.env.LEAD_ENDPOINT||'';
const SIGNUP=process.env.APP_SIGNUP_URL||'https://relay.kontaro.ai/signup';
const LOGIN=process.env.APP_LOGIN_URL||'https://relay.kontaro.ai';
const body=fs.readFileSync(path.join(__dirname,'src/index.html'),'utf8')
  .replace(/<title>[\s\S]*?<\/title>\s*/,'').replace(/<meta name="claude:viewport-fit-sides"[^>]*>\s*/,'').replace(/<meta name="description"[^>]*>\s*/,'');
const LANGS=[{code:'pt',hl:'pt-BR',dir:'',og:'pt_BR'},{code:'en',hl:'en',dir:'en/',og:'en_US'},{code:'es',hl:'es',dir:'es/',og:'es_ES'}];
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
function head(L){
  const url=`${SITE}/${L.dir}`;
  const alts=LANGS.map(x=>`<link rel="alternate" hreflang="${x.hl}" href="${SITE}/${x.dir}">`).join('\n')+`\n<link rel="alternate" hreflang="x-default" href="${SITE}/">`;
  const ORG={"@type":"Organization","@id":SITE+"/#org","name":"Kontaro Inc.","alternateName":"Kontaro","url":SITE,"logo":SITE+"/favicon.svg","email":"talk@kontaro.ai",
    "address":{"@type":"PostalAddress","streetAddress":"830 Brickell Plaza","addressLocality":"Miami","addressRegion":"FL","postalCode":"33131","addressCountry":"US"},
    "sameAs":["https://www.instagram.com/kontaro.ai/","https://www.linkedin.com/company/kontaro-ai/"]};
  const ld={"@context":"https://schema.org","@graph":[ORG,{"@type":"SoftwareApplication","name":"Kontaro","applicationCategory":"BusinessApplication","operatingSystem":"Web","url":SITE,"description":T[L.code].desc,"inLanguage":["pt-BR","en","es"],"publisher":{"@id":SITE+"/#org"}}]};
  return `<!doctype html>
<html lang="${L.hl}" data-prerender-lang="${L.code}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${T[L.code].title}</title>
<meta name="description" content="${T[L.code].desc}">
<link rel="canonical" href="${url}">
${alts}
<meta name="theme-color" content="#2F52F5">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Kontaro">
<meta property="og:title" content="${T[L.code].title}">
<meta property="og:description" content="${T[L.code].desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og-${L.code}.png">
<meta property="og:locale" content="${L.og}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script>window.KONTARO_SIGNUP_URL=${JSON.stringify(SIGNUP)};window.KONTARO_LOGIN_URL=${JSON.stringify(LOGIN)};${LEAD?`window.KONTARO_LEAD_ENDPOINT=${JSON.stringify(LEAD)};`:''}</script>
</head>
<body>
`;}
(async()=>{
  const dist=path.join(__dirname,'dist'); fs.rmSync(dist,{recursive:true,force:true}); fs.mkdirSync(dist);
  const b=await chromium.launch();
  for(const L of LANGS){
    const raw=head(L)+body+'\n</body>\n</html>\n';
    const tmp=path.join(dist,`_tmp_${L.code}.html`); fs.writeFileSync(tmp,raw);
    const p=await b.newPage({viewport:{width:1200,height:630}});
    await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
    await p.setContent(ogCard(L.code)); await p.screenshot({path:path.join(dist,`og-${L.code}.png`)});
    await p.goto('file://'+tmp+'?lang='+L.code); await p.waitForTimeout(800);
    // Pre-render translated text for crawlers; clear animated containers (JS refills them).
    const html=await p.evaluate(()=>{
      ['#heroChat','#adminChat','#answer','#viz','#asked'].forEach(s=>{const e=document.querySelector(s); if(e) e.innerHTML='';});
      document.querySelectorAll('.float').forEach(f=>f.classList.add('dim'));
      const qa=[...document.querySelectorAll('#faqList details')].map(d=>({"@type":"Question","name":d.querySelector('summary').textContent,"acceptedAnswer":{"@type":"Answer","text":d.querySelector('p').textContent}}));
      const sc=document.createElement('script'); sc.type='application/ld+json'; sc.textContent=JSON.stringify({"@context":"https://schema.org","@type":"FAQPage","mainEntity":qa}); document.head.appendChild(sc);
      return '<!doctype html>\n'+document.documentElement.outerHTML;
    });
    const out=path.join(dist,L.dir); fs.mkdirSync(out,{recursive:true});
    fs.writeFileSync(path.join(out,'index.html'),html); fs.unlinkSync(tmp); await p.close();
  }
  await b.close();
  const pub=path.join(__dirname,'public'); if(fs.existsSync(pub)) fs.cpSync(pub,dist,{recursive:true});
  fs.writeFileSync(path.join(dist,'favicon.svg'),'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="1" y="1" width="30" height="30" rx="9" fill="#2F52F5"/><path d="M10 8v16M10 16l8-8M13.5 13.5 21 24" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="23.5" cy="9.5" r="3" fill="#F2672E"/></svg>');
  fs.writeFileSync(path.join(dist,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
  const today=new Date().toISOString().slice(0,10);
  fs.writeFileSync(path.join(dist,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`+
    LANGS.map(L=>`  <url><loc>${SITE}/${L.dir}</loc><lastmod>${today}</lastmod>\n`+LANGS.map(x=>`    <xhtml:link rel="alternate" hreflang="${x.hl}" href="${SITE}/${x.dir}"/>`).join('\n')+`\n  </url>`).join('\n')+`\n`+
    require('child_process').execSync('find '+JSON.stringify(path.join(dist))+' -path "*/blog/*" -name index.html').toString().trim().split('\n').filter(Boolean).concat([path.join(dist,'blog/index.html')]).filter((v,i,a)=>a.indexOf(v)===i)
      .map(f=>'  <url><loc>'+SITE+'/'+path.relative(dist,path.dirname(f)).split(path.sep).join('/')+'/</loc><lastmod>'+today+'</lastmod></url>').join('\n')+`\n</urlset>\n`);
  console.log('Built:',fs.readdirSync(dist));
})();
