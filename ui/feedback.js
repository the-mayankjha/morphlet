const MorphFeedback=(()=>{
 let enabled=true,lastHover=0;try{enabled=localStorage.getItem('morphlet.sound')!=='off';}catch{}
 const sounds=Object.fromEntries(['open','hover','select','success','error'].map(name=>{const audio=new Audio('sounds/'+name+'.wav');audio.volume=name==='hover'?.09:.16;audio.preload='auto';return [name,audio];}));
 function play(name){if(!enabled)return;if(name==='hover'){const now=performance.now();if(now-lastHover<85)return;lastHover=now;}const audio=sounds[name];if(!audio)return;audio.pause();audio.currentTime=0;audio.play().catch(()=>{});}
 function button(){const el=document.getElementById('sound');el.setAttribute('aria-pressed',String(enabled));el.setAttribute('aria-label',enabled?'Mute sound effects':'Enable sound effects');el.title=enabled?'Mute sound effects':'Enable sound effects';el.textContent=enabled?'♪':'♩';}
 document.getElementById('sound').onclick=()=>{enabled=!enabled;try{localStorage.setItem('morphlet.sound',enabled?'on':'off');}catch{}button();play('select');};button();return {play};
})();
