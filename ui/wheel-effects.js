const MorphWheel=(()=>{
 const wheel=document.getElementById('wheel');let accumulated=0,lastScroll=0,index=-1,active=null,overlay=null;
 function highlight(sector){
 if(active===sector&&overlay?.isConnected)return;
 active?.classList.remove('magnify-source');overlay?.remove();active=sector;overlay=null;
 if(!sector||document.body.classList.contains('busy'))return;
 sector.classList.add('magnify-source');const label=sector.nextElementSibling;
 const svg=sector.ownerSVGElement,ns='http://www.w3.org/2000/svg';
 const outer=document.createElementNS(ns,'g');outer.setAttribute('class','magnify-overlay');outer.setAttribute('aria-hidden','true');outer.setAttribute('pointer-events','none');
 const x=Number(label.getAttribute('x')),y=Number(label.getAttribute('y'))-6;
 const length=Math.hypot(x-200,y-200)||1;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 outer.setAttribute('transform',`translate(${(x-200)/length*7} ${(y-200)/length*7})`);
 const group=document.createElementNS(ns,'g');group.setAttribute('class','magnify-group');
 const surface=sector.cloneNode(false);surface.setAttribute('class','magnify-surface');surface.removeAttribute('tabindex');surface.removeAttribute('role');surface.removeAttribute('aria-label');
 const title=label.cloneNode(true);title.setAttribute('class','magnify-label');title.setAttribute('transform',`translate(${x} ${y+6}) scale(1.2) translate(${-x} ${-y-6})`);
 group.append(surface,title);outer.append(group);svg.append(outer);overlay=outer;
 group.animate([{transform:'scale(1)',opacity:.65},{transform:'scale(1.085)',opacity:1}],{duration:reduced?0:220,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
 }
 function open(drag=false){highlight(null);index=-1;accumulated=0;wheel.getAnimations().forEach(a=>a.cancel());document.querySelectorAll('.sector.scroll-selected').forEach(el=>el.classList.remove('scroll-selected'));if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 wheel.animate([{clipPath:'circle(0% at 50% 50%)',opacity:.2},{clipPath:'circle(50% at 50% 50%)',opacity:1}],{duration:drag?210:340,easing:'cubic-bezier(.16,1,.3,1)'});
 document.getElementById('center').animate([{transform:'scale(.65)',opacity:.3},{transform:'scale(1.05)',opacity:1,offset:.7},{transform:'scale(1)',opacity:1}],{duration:drag?210:370,easing:'ease-out'});
 }
 wheel.addEventListener('wheel',event=>{if(document.body.classList.contains('busy')||event.ctrlKey)return;const sectors=[...wheel.querySelectorAll('.sector')];if(!sectors.length)return;event.preventDefault();const delta=Math.abs(event.deltaY)>=Math.abs(event.deltaX)?event.deltaY:event.deltaX;const normalized=delta*(event.deltaMode===1?16:event.deltaMode===2?300:1);const now=performance.now();if(now-lastScroll>220)accumulated=0;accumulated+=normalized;if(Math.abs(accumulated)<28||now-lastScroll<75)return;const direction=Math.sign(accumulated);accumulated=0;lastScroll=now;index=(index<0?(direction>0?0:sectors.length-1):(index+direction+sectors.length)%sectors.length);sectors.forEach((el,i)=>el.classList.toggle('scroll-selected',i===index));sectors[index].focus({preventScroll:true});MorphFeedback.play('scroll');document.getElementById('file-icon').textContent=sectors[index].dataset.format.toUpperCase();document.getElementById('message').textContent='Scroll to choose · Enter to convert';},{passive:false});
 wheel.addEventListener('pointermove',event=>{const sector=event.target.closest?.('.sector');if(sector){wheel.querySelectorAll('.scroll-selected').forEach(el=>el.classList.remove('scroll-selected'));highlight(sector);}});wheel.addEventListener('pointerleave',()=>{if(!wheel.querySelector('.scroll-selected'))highlight(null);});
 return {open,highlight};
})();
