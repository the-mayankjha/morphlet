// A fresh file pasteboard and movement distinguish a drag from an Option-click.
function createDragTrigger(){let idle,gesture;
 return state=>{
  if(!state.down){gesture=undefined;idle={change:state.change,x:state.x,y:state.y};return;}
  if(!gesture)gesture={x:idle?.x??state.x,y:idle?.y??state.y,baseline:idle?.change??state.change,fired:false};
  const moved=Math.hypot(state.x-gesture.x,state.y-gesture.y)>=6;
  if(!gesture.fired&&moved&&state.option&&state.change!==gesture.baseline&&state.files.length){gesture.fired=true;return state.files;}
 };
}
module.exports={createDragTrigger};
