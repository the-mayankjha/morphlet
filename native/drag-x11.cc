
#include <node_api.h>
#include <X11/Xlib.h>
#include <X11/Xatom.h>
#include <string>
#include <chrono>
static Display *display=nullptr;static Window requestor=0;static Atom selection,target,property;static bool previousDown=false,requested=false;static unsigned long revision=0;static std::string uris;static std::chrono::steady_clock::time_point requestedAt;
static void cleanup(void*){if(display){if(requestor)XDestroyWindow(display,requestor);XCloseDisplay(display);display=nullptr;}}
static napi_value poll(napi_env env,napi_callback_info info){
 if(!display){display=XOpenDisplay(nullptr);if(display){requestor=XCreateSimpleWindow(display,DefaultRootWindow(display),0,0,1,1,0,0,0);selection=XInternAtom(display,"XdndSelection",False);target=XInternAtom(display,"text/uri-list",False);property=XInternAtom(display,"MORPHLET_DRAG_FILES",False);}}
 napi_value result;napi_create_object(env,&result);
 auto flag=[&](const char*key,bool value){napi_value v;napi_get_boolean(env,value,&v);napi_set_named_property(env,result,key,v);};
 auto number=[&](const char*key,double value){napi_value v;napi_create_double(env,value,&v);napi_set_named_property(env,result,key,v);};
 flag("supported",display!=nullptr);if(!display)return result;
 Window root,child;int x=0,y=0,wx=0,wy=0;unsigned int mask=0;XQueryPointer(display,DefaultRootWindow(display),&root,&child,&x,&y,&wx,&wy,&mask);
 bool down=(mask&Button1Mask)!=0,option=(mask&Mod1Mask)!=0;Window owner=XGetSelectionOwner(display,selection);
 if(!down||!previousDown){requested=false;uris.clear();while(XPending(display)){XEvent stale;XNextEvent(display,&stale);}}
 if(down&&option&&owner!=None&&!requested){XDeleteProperty(display,requestor,property);XConvertSelection(display,selection,target,property,requestor,CurrentTime);XFlush(display);requested=true;requestedAt=std::chrono::steady_clock::now();}
 while(XPending(display)){XEvent event;XNextEvent(display,&event);if(event.type==SelectionNotify&&down&&requested&&event.xselection.property==property){Atom actual;int format;unsigned long count,remaining;unsigned char*data=nullptr;if(XGetWindowProperty(display,requestor,property,0,262144,True,AnyPropertyType,&actual,&format,&count,&remaining,&data)==Success&&format==8&&data){uris.assign(reinterpret_cast<char*>(data),count);revision++;}if(data)XFree(data);}}
 previousDown=down;flag("down",down);flag("option",option);flag("active",owner!=None);number("x",x);number("y",y);number("change",revision);
 bool timedOut=requested&&std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now()-requestedAt).count()>250;flag("ready",!uris.empty()||timedOut);
 napi_value value;napi_create_string_utf8(env,uris.c_str(),uris.size(),&value);napi_set_named_property(env,result,"uris",value);return result;
}
static napi_value init(napi_env env,napi_value exports){napi_value fn;napi_create_function(env,"poll",NAPI_AUTO_LENGTH,poll,nullptr,&fn);napi_set_named_property(env,exports,"poll",fn);napi_add_env_cleanup_hook(env,cleanup,nullptr);return exports;}
NAPI_MODULE(NODE_GYP_MODULE_NAME,init)
