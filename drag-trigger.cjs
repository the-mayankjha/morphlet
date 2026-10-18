// Require a fresh drag pasteboard and movement; never reuse stale drag files.
function createDragTrigger(){let previousChange,gesture;
 return state=>{
  if(!state.down){gesture=undefined;previousChange=state.change;return;}
  if(!gesture)gesture={x:state.x,y:state.y,baseline:previousChange??state.change,fired:false};
  const moved=Math.hypot(state.x-gesture.x,state.y-gesture.y)>=6;
  if(!gesture.fired&&moved&&state.option&&state.change!==gesture.baseline&&state.files.length){gesture.fired=true;return state.files;}
 };
}
module.exports={createDragTrigger};
