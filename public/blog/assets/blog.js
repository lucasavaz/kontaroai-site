(function(){
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var T=window.KB||{};
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'null');localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}

/* reading progress */
var bar=$('.progress'),art=$('.prose');
if(bar&&art){var onS=function(){var r=art.getBoundingClientRect(),h=r.height-innerHeight+200;var p=Math.min(1,Math.max(0,(-r.top+120)/Math.max(h,1)));bar.style.transform='scaleX('+p+')'};addEventListener('scroll',onS,{passive:true});onS();}

/* toc highlight */
var links=$$('.toc a');
if(links.length&&'IntersectionObserver' in window){
 var map={};links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a});
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(l){l.classList.remove('on')});var a=map[e.target.id];if(a)a.classList.add('on')}})},{rootMargin:'-80px 0px -70% 0px'});
 $$('.prose h2[id]').forEach(function(h){io.observe(h)});
}

/* copy link */
$$('.share').forEach(function(b){b.addEventListener('click',function(){var u=location.href.split('#')[0];var done=function(){var t=b.textContent;b.textContent=T.copied||'Copied';setTimeout(function(){b.textContent=t},1800)};if(navigator.clipboard)navigator.clipboard.writeText(u).then(done,done);else done()})});

/* hub filter */
var chips=$$('.chips button');
chips.forEach(function(c){c.addEventListener('click',function(){var t=c.dataset.topic;chips.forEach(function(x){x.setAttribute('aria-pressed',x===c)});$$('[data-topic-card]').forEach(function(card){card.hidden=!(t==='all'||card.dataset.topicCard===t)})})});

/* response calculator */
$$('[data-widget=calc]').forEach(function(w){
 var m=$('#calc-msgs',w),n=$('#calc-min',w),om=$('#calc-msgs-o',w),on=$('#calc-min-o',w),out=$('.big',w);
 function upd(){om.textContent=m.value;on.textContent=n.value;var h=m.value*n.value*6/60;out.textContent=(Math.round(h*10)/10).toLocaleString(document.documentElement.lang)}
 m.addEventListener('input',upd);n.addEventListener('input',upd);upd();
});

/* window checker */
$$('[data-widget=window]').forEach(function(w){
 var ans=$('.answer',w),btns=$$('.opts button',w);
 btns.forEach(function(b,i){b.addEventListener('click',function(){btns.forEach(function(x){x.setAttribute('aria-pressed',x===b)});
  ans.textContent=i===0?T.win_open.replace('{h}','23'):i===1?T.win_open.replace('{h}','1–22'):i===2?T.win_closed:T.win_new;})});
});

/* checklists */
$$('[data-widget=check]').forEach(function(w){
 var key='kb-check-'+location.pathname+'-'+w.dataset.list,boxes=$$('input',w),fill=$('.bar i',w),lab=$('.count',w),saved=store(key)||[];
 boxes.forEach(function(b,i){b.checked=!!saved[i];b.addEventListener('change',upd)});
 function upd(){var s=boxes.map(function(b){return b.checked});store(key,s);var c=s.filter(Boolean).length;fill.style.width=(c/boxes.length*100)+'%';lab.textContent=c+'/'+boxes.length+' '+(T.check_done||'')}
 upd();
});

/* reveal */
if(!reduce&&'IntersectionObserver' in window){
 var els=$$('.reveal');els.forEach(function(e){if(e.getBoundingClientRect().top>innerHeight)e.classList.add('pre')});
 var ro=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.remove('pre');ro.unobserve(e.target)}})},{threshold:.1});
 els.forEach(function(e){ro.observe(e)});
}
})();
