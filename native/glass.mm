
#include <node_api.h>
#import <Cocoa/Cocoa.h>
#import <QuartzCore/QuartzCore.h>
#import <objc/message.h>
// Region-scoped native materials behind Electron's web content. No screen capture.
static const void *RegionsKey = &RegionsKey;
static double number(napi_env env,napi_value obj,const char *key){napi_value v;double d=0;napi_get_named_property(env,obj,key,&v);napi_get_value_double(env,v,&d);return d;}
static napi_value apply(napi_env env,napi_callback_info info){
 size_t argc=2;napi_value args[2];napi_get_cb_info(env,info,&argc,args,nullptr,nullptr);
 void *bytes=nullptr;size_t length=0;bool buffer=false;
 if(argc!=2||napi_is_buffer(env,args[0],&buffer)!=napi_ok||!buffer){napi_throw_type_error(env,nullptr,"Expected a native window handle");return nullptr;}
 napi_get_buffer_info(env,args[0],&bytes,&length);if(length<sizeof(void*)){napi_throw_type_error(env,nullptr,"Invalid handle");return nullptr;}
 NSView *root=(__bridge NSView *)*(void **)bytes;
 if(![NSThread isMainThread]||!root){napi_throw_error(env,nullptr,"Native material requires the main thread");return nullptr;}
 NSArray *previous=objc_getAssociatedObject(root,RegionsKey);for(NSView *view in previous)[view removeFromSuperview];
 NSMutableArray *views=[NSMutableArray array];uint32_t count=0;napi_get_array_length(env,args[1],&count);
 Class glassClass=NSClassFromString(@"NSGlassEffectView");
 for(uint32_t i=0;i<MIN(count,8);i++){
  napi_value rect;napi_get_element(env,args[1],i,&rect);
  double x=number(env,rect,"x"),y=number(env,rect,"y"),w=number(env,rect,"width"),h=number(env,rect,"height"),radius=number(env,rect,"radius");
  if(!isfinite(x)||!isfinite(y)||!isfinite(w)||!isfinite(h)||w<=0||h<=0)continue;
  NSRect frame=NSMakeRect(x,root.isFlipped?y:root.bounds.size.height-y-h,w,h);
  NSView *view;
  if(glassClass){view=[[glassClass alloc]initWithFrame:frame];
   SEL setRadius=NSSelectorFromString(@"setCornerRadius:");if([view respondsToSelector:setRadius])((void(*)(id,SEL,CGFloat))objc_msgSend)(view,setRadius,radius);
  }else{NSVisualEffectView *effect=[[NSVisualEffectView alloc]initWithFrame:frame];effect.material=NSVisualEffectMaterialPopover;effect.blendingMode=NSVisualEffectBlendingModeBehindWindow;effect.state=NSVisualEffectStateActive;view=effect;}
  view.wantsLayer=YES;view.layer.cornerRadius=radius;view.layer.masksToBounds=YES;
  [root addSubview:view positioned:NSWindowBelow relativeTo:nil];[views addObject:view];
 }
 objc_setAssociatedObject(root,RegionsKey,views,OBJC_ASSOCIATION_RETAIN_NONATOMIC);
 napi_value result;napi_create_string_utf8(env,glassClass?"liquid":"vibrancy",NAPI_AUTO_LENGTH,&result);return result;
}
static napi_value init(napi_env env,napi_value exports){napi_value fn;napi_create_function(env,"apply",NAPI_AUTO_LENGTH,apply,nullptr,&fn);napi_set_named_property(env,exports,"apply",fn);return exports;}
NAPI_MODULE(NODE_GYP_MODULE_NAME,init)
