const MorphWheel=(()=>{
 const wheel=document.getElementById('wheel');let accumulated=0,lastScroll=0,index=-1;
 function open(drag=false){index=-1;accumulated=0;wheel.getAnimations().forEach(a=>a.cancel());document.querySelectorAll('.sector.scroll-selected').forEach(el=>el.classList.remove('scroll-selected'));if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 wheel.animate([{clipPath:'circle(0% at 50% 50%)',opacity:.2},{clipPath:'circle(50% at 50% 50%)',opacity:1}],{duration:drag?210:340,easing:'cubic-bezier(.16,1,.3,1)'});
 document.getElementById('center').animate([{transform:'scale(.65)',opacity:.3},{transform:'scale(1.05)',opacity:1,offset:.7},{transform:'scale(1)',opacity:1}],{duration:drag?210:370,easing:'ease-out'});
 }
 wheel.addEventListener('wheel',event=>{if(document.body.classList.contains('busy')||event.ctrlKey)return;const sectors=[...wheel.querySelectorAll('.sector')];if(!sectors.length)return;event.preventDefault();const delta=Math.abs(event.deltaY)>=Math.abs(event.deltaX)?event.deltaY:event.deltaX;const normalized=delta*(event.deltaMode===1?16:event.deltaMode===2?300:1);const now=performance.now();if(now-lastScroll>220)accumulated=0;accumulated+=normalized;if(Math.abs(accumulated)<28||now-lastScroll<75)return;const direction=Math.sign(accumulated);accumulated=0;lastScroll=now;index=(index<0?(direction>0?0:sectors.length-1):(index+direction+sectors.length)%sectors.length);sectors.forEach((el,i)=>el.classList.toggle('scroll-selected',i===index));sectors[index].focus({preventScroll:true});MorphFeedback.play('scroll');document.getElementById('file-icon').textContent=sectors[index].dataset.format.toUpperCase();document.getElementById('message').textContent='Scroll to choose · Enter to convert';},{passive:false});
 wheel.addEventListener('pointermove',()=>wheel.querySelectorAll('.scroll-selected').forEach(el=>el.classList.remove('scroll-selected')));
 return {open};
})();
