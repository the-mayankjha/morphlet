
#include <node_api.h>
#import <Cocoa/Cocoa.h>
#import <QuartzCore/QuartzCore.h>
#import <ApplicationServices/ApplicationServices.h>
#import <objc/message.h>
// Region-scoped native materials behind Electron's web content. No screen capture.
static const void *RegionsKey = &RegionsKey;
static double number(napi_env env,napi_value obj,const char *key){napi_value v;double d=0;napi_get_named_property(env,obj,key,&v);napi_get_value_double(env,v,&d);return d;}
static napi_value apply(napi_env env,napi_callback_info info){
 size_t argc=4;napi_value args[4];napi_get_cb_info(env,info,&argc,args,nullptr,nullptr);
 void *bytes=nullptr;size_t length=0;bool buffer=false;
 if(argc<2||napi_is_buffer(env,args[0],&buffer)!=napi_ok||!buffer){napi_throw_type_error(env,nullptr,"Expected a native window handle");return nullptr;}
 napi_get_buffer_info(env,args[0],&bytes,&length);if(length<sizeof(void*)){napi_throw_type_error(env,nullptr,"Invalid handle");return nullptr;}
 bool expand=false;if(argc>2)napi_get_value_bool(env,args[2],&expand);char theme[16]={0};if(argc>3)napi_get_value_string_utf8(env,args[3],theme,sizeof(theme),nullptr);
 NSView *root=(__bridge NSView *)*(void **)bytes;
 if(![NSThread isMainThread]||!root){napi_throw_error(env,nullptr,"Native material requires the main thread");return nullptr;}
 // Reassigning an unchanged NSWindow appearance can emit another Electron
 // nativeTheme.updated event, causing a material-rebuild feedback loop.
 NSString *appearanceName=strcmp(theme,"light")==0?NSAppearanceNameAqua:NSAppearanceNameDarkAqua;
 if(theme[0]&&root.window&&![root.window.appearance.name isEqualToString:appearanceName])root.window.appearance=[NSAppearance appearanceNamed:appearanceName];
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
   SEL setStyle=NSSelectorFromString(@"setStyle:");if([view respondsToSelector:setStyle])((void(*)(id,SEL,NSInteger))objc_msgSend)(view,setStyle,1); // Public NSGlassEffectViewStyleClear
   SEL setRadius=NSSelectorFromString(@"setCornerRadius:");if([view respondsToSelector:setRadius])((void(*)(id,SEL,CGFloat))objc_msgSend)(view,setRadius,radius);
  }else{NSVisualEffectView *effect=[[NSVisualEffectView alloc]initWithFrame:frame];effect.material=NSVisualEffectMaterialPopover;effect.blendingMode=NSVisualEffectBlendingModeBehindWindow;effect.state=NSVisualEffectStateActive;view=effect;}
  if(theme[0])view.appearance=[NSAppearance appearanceNamed:strcmp(theme,"light")==0?NSAppearanceNameAqua:NSAppearanceNameDarkAqua];
  view.wantsLayer=YES;view.layer.cornerRadius=radius;view.layer.masksToBounds=YES;
  if(expand&&radius>100){view.frame=NSMakeRect(NSMidX(frame)-1,NSMidY(frame)-1,2,2);}
  [root addSubview:view positioned:NSWindowBelow relativeTo:nil];[views addObject:view];
  if(expand&&radius>100){[NSAnimationContext runAnimationGroup:^(NSAnimationContext *context){context.duration=.28;context.timingFunction=[CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseOut];[[view animator]setFrame:frame];} completionHandler:nil];}
 }
 objc_setAssociatedObject(root,RegionsKey,views,OBJC_ASSOCIATION_RETAIN_NONATOMIC);
 napi_value result;napi_create_string_utf8(env,glassClass?"liquid":"vibrancy",NAPI_AUTO_LENGTH,&result);return result;
}

// Poll public mouse/modifier state and the file drag pasteboard; no keyboard hooks.
static napi_value dragState(napi_env env,napi_callback_info info){
 napi_value state;napi_create_object(env,&state);
 auto boolean=[&](const char *key,bool value){napi_value v;napi_get_boolean(env,value,&v);napi_set_named_property(env,state,key,v);};
 auto number=[&](const char *key,double value){napi_value v;napi_create_double(env,value,&v);napi_set_named_property(env,state,key,v);};
 bool down=([NSEvent pressedMouseButtons]&1)!=0,option=([NSEvent modifierFlags]&NSEventModifierFlagOption)!=0;
 NSPasteboard *board=[NSPasteboard pasteboardWithName:NSPasteboardNameDrag];NSPoint point=[NSEvent mouseLocation];
 NSEventModifierFlags flags=[NSEvent modifierFlags];
 boolean("command",(flags&NSEventModifierFlagCommand)!=0);boolean("control",(flags&NSEventModifierFlagControl)!=0);boolean("shift",(flags&NSEventModifierFlagShift)!=0);
 bool other=false;if(flags&(NSEventModifierFlagCommand|NSEventModifierFlagControl|NSEventModifierFlagOption)){for(CGKeyCode key=0;key<128;key++){if(key>=54&&key<=63)continue;if(CGEventSourceKeyState(kCGEventSourceStateCombinedSessionState,key)){other=true;break;}}}
 boolean("otherKey",other);napi_value owner;napi_create_string_utf8(env,NSWorkspace.sharedWorkspace.frontmostApplication.bundleIdentifier.UTF8String?:"",NAPI_AUTO_LENGTH,&owner);napi_set_named_property(env,state,"owner",owner);
 boolean("down",down);boolean("option",option);number("x",point.x);number("y",point.y);number("change",board.changeCount);
 napi_value paths;napi_create_array(env,&paths);
 if(down&&option){NSArray *urls=[board readObjectsForClasses:@[[NSURL class]] options:@{NSPasteboardURLReadingFileURLsOnlyKey:@YES}];uint32_t i=0;for(NSURL *url in urls){if(i>=100)break;if(url.isFileURL&&url.path){napi_value value;napi_create_string_utf8(env,url.path.UTF8String,NAPI_AUTO_LENGTH,&value);napi_set_element(env,paths,i++,value);}}}
 napi_set_named_property(env,state,"files",paths);return state;
}
static napi_value init(napi_env env,napi_value exports){napi_value fn;napi_create_function(env,"apply",NAPI_AUTO_LENGTH,apply,nullptr,&fn);napi_set_named_property(env,exports,"apply",fn);napi_create_function(env,"dragState",NAPI_AUTO_LENGTH,dragState,nullptr,&fn);napi_set_named_property(env,exports,"dragState",fn);return exports;}
NAPI_MODULE(NODE_GYP_MODULE_NAME,init)
