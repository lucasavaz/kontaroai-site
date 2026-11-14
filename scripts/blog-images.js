// Makes WebP copies of the blog share images (public/blog/og/*.jpg) for use on the page:
//   og/webp/<name>.webp      1200x630 (featured image on the blog index)
//   og/webp/<name>-640.webp   640x336 (article cards)
// The .jpg files stay as og:image for social networks. Skips files that are already up to date.
// Usage: node scripts/blog-images.js   (uses the Chromium that comes with Playwright, no other tools)
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','public','blog','og'),out=path.join(dir,'webp');
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch(),p=await b.newPage(); let n=0;
  for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.jpg'))){
    const name=f.replace(/\.jpg$/,''),src=path.join(dir,f),t=fs.statSync(src).mtimeMs;
    const targets=[[name+'.webp',1200,630],[name+'-640.webp',640,336]];
    if(targets.every(([o])=>fs.existsSync(path.join(out,o))&&fs.statSync(path.join(out,o)).mtimeMs>=t)) continue;
    const data='data:image/jpeg;base64,'+fs.readFileSync(src).toString('base64');
    for(const [o,w,h] of targets){
      const b64=await p.evaluate(async([data,w,h])=>{const i=new Image();i.src=data;await i.decode();const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(i,0,0,w,h);return c.toDataURL('image/webp',0.82).split(',')[1];},[data,w,h]);
      fs.writeFileSync(path.join(out,o),Buffer.from(b64,'base64')); n++;
    }
  }
  await b.close(); console.log('WebP files written:',n);
})();
