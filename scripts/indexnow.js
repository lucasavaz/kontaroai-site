// Tells Bing, Yandex and other IndexNow search engines which pages changed, so they crawl them sooner.
// Google does not use IndexNow; for Google, the sitemap in Search Console is enough.
//
// Run it AFTER a deploy is live:
//   npm run indexnow                       -> pages whose sitemap <lastmod> is today (UTC)
//   npm run indexnow -- --since=2026-11-01 -> pages changed on or after that date
//   npm run indexnow -- --all              -> every page in the sitemap
//   npm run indexnow -- https://kontaro.ai/precos/ https://kontaro.ai/blog/   -> just these pages
//   add --dry-run to see the list without sending anything
//
// The key is the <32 hex characters>.txt file in public/ (deployed at https://kontaro.ai/<key>.txt).
const fs=require('fs'),path=require('path');
const SITE=(process.env.SITE_URL||'https://kontaro.ai').replace(/\/$/,'');
const args=process.argv.slice(2),flag=n=>args.find(a=>a===n||a.startsWith(n+'='));
const dry=!!flag('--dry-run'),all=!!flag('--all');
const since=(flag('--since')||'').split('=')[1]||new Date().toISOString().slice(0,10);
const explicit=args.filter(a=>/^https?:\/\//.test(a));

(async()=>{
  const pub=path.join(__dirname,'..','public');
  const keyFile=fs.readdirSync(pub).find(f=>/^[0-9a-f]{32}\.txt$/.test(f)&&fs.readFileSync(path.join(pub,f),'utf8').trim()===f.slice(0,32));
  if(!keyFile) throw new Error('No IndexNow key file found in public/');
  const key=keyFile.slice(0,32),keyLocation=`${SITE}/${keyFile}`;

  let urls=explicit;
  if(!urls.length){
    const xml=await (await fetch(`${SITE}/sitemap.xml`)).text();
    const entries=[...xml.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].map(m=>({loc:m[1],lastmod:m[2]}));
    if(!entries.length) throw new Error('Could not read the live sitemap at '+SITE+'/sitemap.xml');
    urls=entries.filter(e=>all||e.lastmod>=since).map(e=>e.loc);
  }
  urls=[...new Set(urls)].filter(u=>u.startsWith(SITE+'/'));
  console.log(`${urls.length} URL(s)${all||explicit.length?'':' changed since '+since}:`); urls.forEach(u=>console.log('  '+u));
  if(!urls.length){console.log('Nothing to send. Use --since=YYYY-MM-DD or --all.');return;}
  if(dry){console.log('Dry run: nothing sent.');return;}

  const live=await fetch(keyLocation).then(r=>r.ok?r.text():'').catch(()=>'');
  if(live.trim()!==key) throw new Error(`The key file is not live at ${keyLocation}. Deploy first, then run this again.`);

  for(let i=0;i<urls.length;i+=10000){
    const res=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'content-type':'application/json; charset=utf-8'},
      body:JSON.stringify({host:new URL(SITE).host,key,keyLocation,urlList:urls.slice(i,i+10000)})});
    console.log(`IndexNow answered ${res.status} ${res.statusText}`+(res.status===200||res.status===202?' (accepted)':' '+await res.text()));
  }
})().catch(e=>{console.error('Error:',e.message);process.exitCode=1;});
