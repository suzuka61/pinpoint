(function(){var I=Object.defineProperty;var A=(i,n,e)=>n in i?I(i,n,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[n]=e;var h=(i,n,e)=>A(i,typeof n!="symbol"?n+"":n,e);const S=document;function u(i,n={}){S.dispatchEvent(new CustomEvent(i,{detail:n,bubbles:!0,composed:!0}))}function m(i,n){S.addEventListener(i,n)}function f(i,n){S.removeEventListener(i,n)}const U=`:host {
  position: fixed;
  z-index: 2147483646;
  pointer-events: none;
}`;class X extends HTMLElement{constructor(){super();h(this,"_update",({detail:e})=>{const{rect:t,el:o}=e;this.box.style.cssText=`
      position:fixed;
      left:${t.left}px;top:${t.top}px;
      width:${t.width}px;height:${t.height}px;
      border:1px dashed rgba(59,130,246,0.6);
      pointer-events:none;
    `,this.label.textContent=o.localName+(o.id?"#"+o.id:o.className?"."+o.className.split(" ")[0]:""),this.label.style.cssText=`
      position:fixed;left:${t.left}px;top:${t.top-18}px;
      font-size:11px;color:#fff;background:rgba(59,130,246,0.85);
      padding:1px 6px;border-radius:3px;pointer-events:none;
      white-space:nowrap;
    `});this.attachShadow({mode:"open"}),this.shadowRoot.adoptedStyleSheets=[V(U)],this.box=this.shadowRoot.appendChild(document.createElement("div")),this.label=this.shadowRoot.appendChild(document.createElement("span"))}connectedCallback(){m("pinpoint:hover",this._update),this.style.cssText="position:fixed;z-index:2147483646;pointer-events:none;"}disconnectedCallback(){f("pinpoint:hover",this._update)}}function V(i){const n=new CSSStyleSheet;return n.replaceSync(i),n}customElements.define("pinpoint-hover",X);const D=`:host {
  position: fixed;
  z-index: 2147483646;
  pointer-events: none;
}`;class K extends HTMLElement{constructor(){super();h(this,"_update",({detail:e})=>{for(const t of this.boxes)t.remove();this.boxes=[];for(const t of e.rects){const o=this.shadowRoot.appendChild(document.createElement("div")),s=this.shadowRoot.appendChild(document.createElement("span"));o.style.cssText=`
        position:fixed;
        left:${t.left}px;top:${t.top}px;
        width:${t.width}px;height:${t.height}px;
        border:2px solid rgba(59,130,246,0.9);
        background:rgba(59,130,246,0.08);
        pointer-events:none;
      `,s.textContent=`${Math.round(t.width)} × ${Math.round(t.height)}`,s.style.cssText=`
        position:fixed;left:${t.left}px;top:${t.top-18}px;
        font-size:11px;color:#fff;background:rgba(59,130,246,0.9);
        padding:1px 6px;border-radius:3px;pointer-events:none;
      `,this.boxes.push(o,s)}});this.attachShadow({mode:"open"}),this.shadowRoot.adoptedStyleSheets=[q(D)],this.boxes=[]}connectedCallback(){m("pinpoint:selected",this._update),this.style.cssText="position:fixed;z-index:2147483646;pointer-events:none;"}disconnectedCallback(){f("pinpoint:selected",this._update)}}function q(i){const n=new CSSStyleSheet;return n.replaceSync(i),n}customElements.define("pinpoint-selected",K);const Y=`:host {
  position: fixed;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  background: #1e293b;
  border-radius: 8px;
  padding: 4px;
  gap: 2px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  user-select: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.handle {
  cursor: grab;
  padding: 4px 8px;
  color: #94a3b8;
  font-size: 14px;
  letter-spacing: 2px;
}

.mode-btn {
  padding: 6px 10px;
  border-radius: 4px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 12px;
  border: none;
  outline: none;
}

.mode-btn.active {
  background: #3b82f6;
  color: #fff;
}

.mode-btn:hover:not(.active) {
  background: rgba(255,255,255,0.1);
}`,L=[{key:"D",label:"设计",name:"design"},{key:"R",label:"标尺",name:"ruler"},{key:"L",label:"布局",name:"layout"},{key:"V",label:"列表",name:"overview"}];class G extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.shadowRoot.adoptedStyleSheets=[J(Y)],this.setAttribute("data-pinpoint-ui",""),this.currentMode="design"}connectedCallback(){this.render(),this._bindKeys()}render(){const n=this.shadowRoot;n.innerHTML="";const e=n.appendChild(document.createElement("span"));e.className="handle",e.textContent="⋮⋮",this._makeDraggable(e);for(const o of L){const s=n.appendChild(document.createElement("button"));s.className="mode-btn"+(o.name===this.currentMode?" active":""),s.textContent=o.label,s.title=`${o.label} (${o.key})`,s.addEventListener("click",()=>this._setMode(o.name))}const t=n.appendChild(document.createElement("button"));t.className="mode-btn",t.textContent="···"}_setMode(n){this.currentMode=n,u("pinpoint:mode",{mode:n}),this.render()}_bindKeys(){this._keyHandler=n=>{for(const e of L)n.key.toUpperCase()===e.key&&!n.ctrlKey&&!n.metaKey&&this._setMode(e.name)},document.addEventListener("keydown",this._keyHandler)}disconnectedCallback(){document.removeEventListener("keydown",this._keyHandler)}_makeDraggable(n){let e,t,o,s;n.addEventListener("mousedown",r=>{e=r.clientX,t=r.clientY;const a=this.getBoundingClientRect();o=a.left,s=a.top,this.style.transform="none";const d=l=>{const p=l.clientX-e,g=l.clientY-t;let x=o+p,b=s+g;b<40&&(b=8),b>window.innerHeight-40&&(b=window.innerHeight-this.offsetHeight-8),this.style.left=x+"px",this.style.top=b+"px"},c=()=>{document.removeEventListener("mousemove",d),document.removeEventListener("mouseup",c)};document.addEventListener("mousemove",d),document.addEventListener("mouseup",c)})}}function J(i){const n=new CSSStyleSheet;return n.replaceSync(i),n}customElements.define("pinpoint-toolbar",G);const W={text:["color","font-size","font-weight","font-family","line-height","letter-spacing","text-align"],dimension:["width","height"],spacing:["padding","padding-top","padding-right","padding-bottom","padding-left","gap"],appearance:["border-radius","background-color","border","box-shadow"]};function Q(i){var t;const n=getComputedStyle(i),e={};for(const o of Object.values(W))for(const s of o)e[s]=n.getPropertyValue(s).trim();return e._textContent=((t=i.textContent)==null?void 0:t.trim().slice(0,100))||"",e._tagName=i.localName,e}function Z(i,n,e){const t=i.style.getPropertyValue(n)||getComputedStyle(i).getPropertyValue(n);return i.style.setProperty(n,e),{prop:n,from:t,to:e}}function ee(i,n){for(const[e,{from:t}]of Object.entries(n))t?i.style.setProperty(e,t):i.style.removeProperty(e)}const te=`:host {
  position: fixed;
  z-index: 2147483647;
  background: #1e293b;
  border-radius: 10px;
  width: 280px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #e2e8f0;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #0f172a;
  border-bottom: 1px solid #334155;
}

.tab-btn {
  padding: 4px 12px;
  border-radius: 4px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 12px;
  border: none;
}

.tab-btn.active {
  background: #3b82f6;
  color: #fff;
}

.pin-btn {
  background: transparent;
  color: #94a3b8;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

.pin-btn.pinned {
  color: #3b82f6;
}

.body {
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.group {
  margin-bottom: 12px;
}

.group-title {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 6px;
  font-weight: 600;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.field-label {
  font-size: 11px;
  color: #94a3b8;
  min-width: 60px;
}

.field-input {
  width: 100%;
  padding: 4px 8px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 4px;
  color: #e2e8f0;
  font-size: 12px;
  outline: none;
}

.field-input:focus {
  border-color: #3b82f6;
}

.color-trigger {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #475569;
  cursor: pointer;
}

.no-element {
  text-align: center;
  color: #64748b;
  padding: 24px;
  font-size: 13px;
}`;class ne extends HTMLElement{constructor(){super();h(this,"_onSelected",({detail:e})=>{this.el=e.els[0],this.styles=Q(this.el),this._renderEditor(),this._position()});this.attachShadow({mode:"open"}),this.shadowRoot.adoptedStyleSheets=[oe(te)],this.setAttribute("data-pinpoint-ui",""),this.el=null,this.styles=null,this.tab="style",this.pinned=!1,this.pinSide="right"}connectedCallback(){m("pinpoint:selected",this._onSelected),this._renderEmpty(),this.shadowRoot.addEventListener("mousedown",e=>e.stopPropagation())}disconnectedCallback(){f("pinpoint:selected",this._onSelected)}_position(){if(this.pinned)return;const e=this.el.getBoundingClientRect(),t=280,o=420;let s=e.right+8,r=e.top;s+t>window.innerWidth&&(s=e.left-t-8),r+o>window.innerHeight&&(r=Math.max(8,window.innerHeight-o-8)),s<8&&(s=8),this.style.left=s+"px",this.style.top=r+"px"}_renderEmpty(){this.shadowRoot.innerHTML='<div class="no-element">点击页面元素开始编辑</div>'}_renderEditor(){const e=this.shadowRoot;e.innerHTML="";const t=e.appendChild(document.createElement("div"));t.className="header";const o=t.appendChild(document.createElement("button"));o.className="tab-btn"+(this.tab==="style"?" active":""),o.textContent="样式",o.onclick=()=>{this.tab="style",this._renderEditor()};const s=t.appendChild(document.createElement("button"));s.className="tab-btn"+(this.tab==="code"?" active":""),s.textContent="代码",s.onclick=()=>{this.tab="code",this._renderEditor()};const r=t.appendChild(document.createElement("button"));r.className="pin-btn"+(this.pinned?" pinned":""),r.textContent="📌",r.onclick=()=>this._togglePin();const a=e.appendChild(document.createElement("div"));a.className="body",this.tab==="code"?this._renderCodeTab(a):this._renderStyleTab(a)}_renderStyleTab(e){var c;const t=this.styles,o=e.appendChild(document.createElement("div"));o.className="group",o.innerHTML='<div class="group-title">文本</div>',this._addField(o,"内容","_textContent",t._textContent,"text"),this._addField(o,"颜色","color",t.color,"color"),this._addField(o,"字号","font-size",t["font-size"],"dimension");const s=e.appendChild(document.createElement("div"));s.className="group",s.innerHTML='<div class="group-title">尺寸</div>',this._addField(s,"宽","width",t.width,"dimension"),this._addField(s,"高","height",t.height,"dimension");const r=e.appendChild(document.createElement("div"));r.className="group",r.innerHTML='<div class="group-title">间距</div>',this._addField(r,"Padding","padding",t.padding,"dimension");const a=e.appendChild(document.createElement("div"));a.className="group",a.innerHTML='<div class="group-title">字体</div>',this._addField(a,"字重","font-weight",t["font-weight"],"dimension"),this._addField(a,"行高","line-height",t["line-height"],"dimension");const d=e.appendChild(document.createElement("div"));if(d.className="group",d.innerHTML='<div class="group-title">外观</div>',this._addField(d,"圆角","border-radius",t["border-radius"],"dimension"),this._addField(d,"填充","background-color",t["background-color"],"color"),this._addField(d,"描边","border",t.border,"dimension"),this._addField(d,"投影","box-shadow",t["box-shadow"],"dimension"),((c=this.el)==null?void 0:c.localName)==="img"){const l=e.appendChild(document.createElement("div"));l.className="group",l.innerHTML='<div class="group-title">图片</div>';const p=l.appendChild(document.createElement("div"));p.className="field-row";const g=p.appendChild(document.createElement("button"));g.className="mode-btn",g.textContent="替换图片",g.style.cssText="padding:6px 12px;border-radius:4px;background:#3b82f6;color:#fff;border:none;cursor:pointer;font-size:12px;",g.onclick=()=>this._pickImage()}}_renderCodeTab(e){if(!this.el)return;const t=document.createElement("textarea");t.className="field-input",t.style.cssText="width:100%;height:200px;resize:vertical;font-size:11px;";const o=[];for(const s of this.el.style){const r=this.el.style.getPropertyValue(s);o.push(`${s}: ${r}`)}t.value=o.join(`
`)||"暂无修改",t.addEventListener("input",()=>{for(const s of t.value.split(`
`)){const[r,...a]=s.split(":");r&&a.length&&this.el.style.setProperty(r.trim(),a.join(":").trim())}}),e.appendChild(t)}_addField(e,t,o,s,r){const a=e.appendChild(document.createElement("div"));a.className="field-row";const d=a.appendChild(document.createElement("span"));if(d.className="field-label",d.textContent=t,r==="color"){const c=a.appendChild(document.createElement("div"));c.className="color-trigger",c.style.background=s||"transparent",c.onclick=()=>this._openColorPicker(o,s,c)}else{const c=a.appendChild(document.createElement("input"));c.className="field-input",c.value=s||"",c.type="text",c.addEventListener("change",()=>{if(o==="_textContent")this.el.textContent=c.value;else{const l=Z(this.el,o,c.value);u("pinpoint:style-changed",{el:this.el,prop:l.prop,from:l.from,to:l.to})}}),r==="dimension"&&this._makeDragAdjustable(c,o)}}_makeDragAdjustable(e,t){let o,s;e.addEventListener("mousedown",r=>{if(r.button!==0)return;o=r.clientX,s=parseFloat(e.value)||0;const a=c=>{var x;const l=c.clientX-o,p=c.shiftKey?10:1,g=s+l*p*.5;e.value=g+(((x=e.value.match(/[a-z%]+/))==null?void 0:x[0])||"px")},d=()=>{document.removeEventListener("mousemove",a),document.removeEventListener("mouseup",d),e.dispatchEvent(new Event("change"))};document.addEventListener("mousemove",a),document.addEventListener("mouseup",d)})}_openColorPicker(e,t,o){u("pinpoint:color-request",{prop:e,currentColor:t,el:this.el,trigger:o})}_togglePin(){this.pinned=!this.pinned,this.pinned?(this.pinSide="right",this.style.left=window.innerWidth-288+"px",this.style.top="8px",this.style.height="calc(100vh - 16px)"):(this.style.height="",this._position()),u("pinpoint:editor-pin",{pinned:this.pinned,side:this.pinSide}),this._renderEditor()}_pickImage(){const e=document.createElement("input");e.type="file",e.accept="image/*",e.onchange=()=>{const t=e.files[0];if(!t)return;const o=URL.createObjectURL(t);this.el.src=o,u("pinpoint:style-changed",{el:this.el,prop:"imageReplace",from:this.el._originalSrc,to:t.name}),this.el._pinpointImageFile=t},e.click()}}function oe(i){const n=new CSSStyleSheet;return n.replaceSync(i),n}customElements.define("pinpoint-editor",ne);function v(i,n,e){n/=100,e/=100;const t=e*n,o=t*(1-Math.abs(i/60%2-1)),s=e-t;let r,a,d;return i<60?(r=t,a=o,d=0):i<120?(r=o,a=t,d=0):i<180?(r=0,a=t,d=o):i<240?(r=0,a=o,d=t):i<300?(r=o,a=0,d=t):(r=t,a=0,d=o),{r:Math.round((r+s)*255),g:Math.round((a+s)*255),b:Math.round((d+s)*255)}}function $(i,n,e){i/=255,n/=255,e/=255;const t=Math.max(i,n,e),o=Math.min(i,n,e),s=t-o;let r,a=t===0?0:s/t,d=t;return s===0?r=0:t===i?r=60*((n-e)/s%6):t===n?r=60*((e-i)/s+2):r=60*((i-n)/s+4),r<0&&(r+=360),{h:Math.round(r),s:Math.round(a*100),v:Math.round(d*100)}}function N(i,n,e){return"#"+[i,n,e].map(t=>t.toString(16).padStart(2,"0")).join("")}function ie(i){return i=i.replace("#",""),i.length===3&&(i=i.split("").map(n=>n+n).join("")),{r:parseInt(i.slice(0,2),16),g:parseInt(i.slice(2,4),16),b:parseInt(i.slice(4,6),16)}}function R(i){if(!i)return{h:0,s:0,v:100,a:1};i=i.trim();const n=i.match(/^#([0-9a-f]{3,8})$/i);if(n){const t=ie("#"+n[1]);return{...$(t.r,t.g,t.b),a:1}}const e=i.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);return e?{...$(+e[1],+e[2],+e[3]),a:e[4]!==void 0?+e[4]:1}:{h:0,s:0,v:100,a:1}}const se=`:host {
  position: fixed;
  z-index: 2147483647;
  background: #1e293b;
  border-radius: 10px;
  padding: 12px;
  width: 240px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #e2e8f0;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}

.sv-panel {
  width: 100%;
  height: 160px;
  border-radius: 6px;
  cursor: crosshair;
  position: relative;
  margin-bottom: 10px;
}

.sv-cursor {
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  border-radius: 50%;
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 0 2px rgba(0,0,0,0.5);
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.slider-row label {
  font-size: 11px;
  color: #94a3b8;
  min-width: 28px;
}

.slider-track {
  flex: 1;
  height: 14px;
  border-radius: 7px;
  position: relative;
  cursor: pointer;
}

.slider-thumb {
  width: 8px;
  height: 18px;
  border: 2px solid #fff;
  border-radius: 3px;
  position: absolute;
  top: -2px;
  transform: translateX(-50%);
  pointer-events: none;
  box-shadow: 0 0 2px rgba(0,0,0,0.5);
}

.format-row {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.format-btn {
  flex: 1;
  padding: 4px;
  border-radius: 4px;
  background: #0f172a;
  color: #94a3b8;
  border: none;
  cursor: pointer;
  font-size: 11px;
}

.format-btn.active {
  background: #3b82f6;
  color: #fff;
}

.hex-input {
  width: 100%;
  padding: 4px 8px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 4px;
  color: #e2e8f0;
  font-size: 12px;
  margin-top: 8px;
  outline: none;
  box-sizing: border-box;
}`;class re extends HTMLElement{constructor(){super();h(this,"_onRequest",({detail:e})=>{const{prop:t,currentColor:o,el:s,trigger:r}=e;this.prop=t,this.el=s;const a=R(o);this.h=a.h,this.s=a.s,this.v=a.v,this.a=a.a,this._visible=!0,this.style.display="",this._render(),this._position(r)});this.attachShadow({mode:"open"}),this.shadowRoot.adoptedStyleSheets=[de(se)],this.setAttribute("data-pinpoint-ui",""),this.h=0,this.s=100,this.v=100,this.a=1,this.prop=null,this.el=null,this.format="hex",this._visible=!1}connectedCallback(){m("pinpoint:color-request",this._onRequest),this.style.display="none"}disconnectedCallback(){f("pinpoint:color-request",this._onRequest)}_position(e){const t=e.getBoundingClientRect(),o=264,s=320;let r=t.right+8,a=t.top;r+o>window.innerWidth&&(r=t.left-o-8),a+s>window.innerHeight&&(a=Math.max(8,window.innerHeight-s-8)),this.style.left=r+"px",this.style.top=a+"px"}_render(){const e=this.shadowRoot;e.innerHTML="";const t=e.appendChild(document.createElement("div"));t.className="sv-panel";const{r:o,g:s,b:r}=v(this.h,100,100);t.style.background=`linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, rgb(${o},${s},${r}))`;const a=t.appendChild(document.createElement("div"));a.className="sv-cursor",a.style.left=this.s+"%",a.style.top=100-this.v+"%",this._bindSV(t),this._renderSlider(e,"H","linear-gradient(to right, #f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",this.h/360,"hue"),this._renderSlider(e,"A",`linear-gradient(to right, transparent, ${this._currentColor()})`,this.a,"alpha");const d=e.appendChild(document.createElement("div"));d.className="format-row";for(const l of["hex","rgb","hsl"]){const p=d.appendChild(document.createElement("button"));p.className="format-btn"+(l===this.format?" active":""),p.textContent=l.toUpperCase(),p.onclick=()=>{this.format=l,this._render()}}const c=e.appendChild(document.createElement("input"));c.className="hex-input",c.value=this._formatColor(),c.addEventListener("change",()=>{const l=R(c.value);this.h=l.h,this.s=l.s,this.v=l.v,this.a=l.a,this._applyColor(),this._render()}),setTimeout(()=>{this._closeHandler=l=>{!this.contains(l.target)&&!l.target.closest("[data-pinpoint-ui]")&&this._close()},document.addEventListener("mousedown",this._closeHandler,{once:!0})},100)}_renderSlider(e,t,o,s,r){const a=e.appendChild(document.createElement("div"));a.className="slider-row";const d=a.appendChild(document.createElement("label"));d.textContent=t;const c=a.appendChild(document.createElement("div"));c.className="slider-track",c.style.background=o;const l=c.appendChild(document.createElement("div"));l.className="slider-thumb",l.style.left=s*100+"%",this._bindSlider(c,r)}_bindSV(e){const t=o=>{const s=e.getBoundingClientRect();this.s=Math.round(Math.max(0,Math.min(100,(o.clientX-s.left)/s.width*100))),this.v=Math.round(Math.max(0,Math.min(100,(1-(o.clientY-s.top)/s.height)*100))),this._applyColor(),this._render()};e.addEventListener("mousedown",o=>{t(o);const s=()=>{document.removeEventListener("mousemove",t),document.removeEventListener("mouseup",s)};document.addEventListener("mousemove",t),document.addEventListener("mouseup",s)})}_bindSlider(e,t){const o=s=>{const r=e.getBoundingClientRect(),a=Math.max(0,Math.min(1,(s.clientX-r.left)/r.width));t==="hue"?this.h=Math.round(a*360):this.a=Math.round(a*100)/100,this._applyColor(),this._render()};e.addEventListener("mousedown",s=>{o(s);const r=()=>{document.removeEventListener("mousemove",o),document.removeEventListener("mouseup",r)};document.addEventListener("mousemove",o),document.addEventListener("mouseup",r)})}_currentColor(){const{r:e,g:t,b:o}=v(this.h,this.s,this.v);return`rgb(${e},${t},${o})`}_formatColor(){const{r:e,g:t,b:o}=v(this.h,this.s,this.v);return this.format==="hex"?N(e,t,o):this.format==="rgb"?this.a<1?`rgba(${e}, ${t}, ${o}, ${this.a})`:`rgb(${e}, ${t}, ${o})`:N(e,t,o)}_applyColor(){if(!this.el||!this.prop)return;const e=this.a<1?`rgba(${v(this.h,this.s,this.v).r}, ${v(this.h,this.s,this.v).g}, ${v(this.h,this.s,this.v).b}, ${this.a})`:this._currentColor(),t=ae(this.el,this.prop,e);u("pinpoint:style-changed",{el:this.el,prop:this.prop,from:t.from,to:e})}_close(){this._visible=!1,this.style.display="none",this._closeHandler&&document.removeEventListener("mousedown",this._closeHandler)}}function ae(i,n,e){const t=i.style.getPropertyValue(n)||getComputedStyle(i).getPropertyValue(n);return i.style.setProperty(n,e),{from:t,to:e}}function de(i){const n=new CSSStyleSheet;return n.replaceSync(i),n}customElements.define("pinpoint-color-popover",re);const le=`:host {
  position: fixed;
  top: 0;
  right: 0;
  width: 320px;
  height: 100vh;
  z-index: 2147483647;
  background: #0f172a;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #1e293b;
  box-shadow: -4px 0 12px rgba(0,0,0,0.3);
}

.tabs {
  display: flex;
  border-bottom: 1px solid #1e293b;
}

.tab {
  flex: 1;
  padding: 10px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  cursor: pointer;
  background: transparent;
  border: none;
}

.tab.active {
  color: #3b82f6;
  border-bottom: 2px solid #3b82f6;
}

.records {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.record {
  background: #1e293b;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 6px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.record-label {
  font-size: 12px;
  font-weight: 600;
}

.record-selector {
  font-size: 10px;
  color: #64748b;
  margin-bottom: 4px;
}

.record-summary {
  font-size: 11px;
  color: #94a3b8;
}

.record-actions {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}

.record-actions button {
  padding: 3px 8px;
  border-radius: 3px;
  background: #334155;
  color: #94a3b8;
  border: none;
  cursor: pointer;
  font-size: 10px;
}

.record-actions button:hover {
  background: #475569;
}

.footer {
  padding: 10px;
  border-top: 1px solid #1e293b;
  display: flex;
  gap: 6px;
}

.footer button {
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  background: #3b82f6;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 12px;
}

.footer button.secondary {
  background: #334155;
  color: #e2e8f0;
}

.empty {
  text-align: center;
  color: #64748b;
  padding: 40px 20px;
  font-size: 13px;
}`;class ce extends HTMLElement{constructor(){super();h(this,"_onStyleChanged",({detail:e})=>{var l;const{el:t,prop:o,from:s,to:r}=e,a=pe(t),d=he(a);this.records.has(d)||this.records.set(d,{id:d,selector:a,label:t.localName+(t.id?"#"+t.id:t.className?"."+t.className.split(" ")[0]:""),text:((l=t.textContent)==null?void 0:l.trim().slice(0,60))||"",frame:T(t),styleChanges:{},el:t});const c=this.records.get(d);c.styleChanges[o]={from:s,to:r},c.frame=T(t),this._render()});h(this,"_onReset",({detail:e})=>{const{id:t}=e,o=this.records.get(t);o&&(ee(o.el,o.styleChanges),this.records.delete(t),this._render())});h(this,"_onToggle",({detail:e})=>{this._visible=e.open,this.style.display=this._visible?"":"none",this._visible&&this._render()});this.attachShadow({mode:"open"}),this.shadowRoot.adoptedStyleSheets=[ue(le)],this.setAttribute("data-pinpoint-ui",""),this.records=new Map,this.tab="all",this._visible=!1}connectedCallback(){m("pinpoint:style-changed",this._onStyleChanged),m("pinpoint:overview-toggle",this._onToggle),m("pinpoint:style-reset",this._onReset),this.style.display="none",this.shadowRoot.addEventListener("mousedown",e=>e.stopPropagation())}disconnectedCallback(){f("pinpoint:style-changed",this._onStyleChanged),f("pinpoint:overview-toggle",this._onToggle),f("pinpoint:style-reset",this._onReset)}_render(){const e=this.shadowRoot;e.innerHTML="";const t=e.appendChild(document.createElement("div"));t.className="tabs";for(const c of["全部","配置"]){const l=t.appendChild(document.createElement("button"));l.className="tab"+(c===this.tab?" active":""),l.textContent=c+(c==="全部"?` (${this.records.size})`:""),l.onclick=()=>{this.tab=c==="全部"?"all":"config",this._render()}}const o=e.appendChild(document.createElement("div"));if(o.className="records",this.records.size===0)o.innerHTML='<div class="empty">暂无修改记录</div>';else for(const[c,l]of this.records){const p=o.appendChild(document.createElement("div"));p.className="record";const g=p.appendChild(document.createElement("div"));g.className="record-header";const x=g.appendChild(document.createElement("span"));x.className="record-label",x.textContent=l.label;const b=p.appendChild(document.createElement("div"));b.className="record-selector",b.textContent=l.selector;const _=p.appendChild(document.createElement("div"));_.className="record-summary",_.textContent=Object.keys(l.styleChanges).map(F=>`${F}`).join(", ");const y=p.appendChild(document.createElement("div"));y.className="record-actions";const E=y.appendChild(document.createElement("button"));E.textContent="定位",E.onclick=()=>{l.el.scrollIntoView({behavior:"smooth",block:"center"}),u("pinpoint:selected",{els:[l.el],rects:[l.el.getBoundingClientRect()]})};const k=y.appendChild(document.createElement("button"));k.textContent="重置",k.onclick=()=>u("pinpoint:style-reset",{id:c});const M=y.appendChild(document.createElement("button"));M.textContent="复制P",M.onclick=()=>this._copySinglePrompt(l)}const s=e.appendChild(document.createElement("div"));s.className="footer";const r=s.appendChild(document.createElement("button"));r.textContent="复制整页Prompt",r.onclick=()=>this._copyAllPrompt();const a=s.appendChild(document.createElement("button"));a.className="secondary",a.textContent="导出JSON",a.onclick=()=>this._exportJSON();const d=s.appendChild(document.createElement("button"));d.className="secondary",d.textContent="导入JSON",d.onclick=()=>this._importJSON()}_copySinglePrompt(e){let t=`### ${e.label}
- 选择器: \`${e.selector}\`
- 修改项:
`;for(const[o,{from:s,to:r}]of Object.entries(e.styleChanges))t+=`  1. ${o}: ${s} → ${r}
`;navigator.clipboard.writeText(t)}_copyAllPrompt(){let e=`## Pinpoint 页面修改指令

`,t=1;for(const[,o]of this.records){e+=`### 元素 ${t}
- 选择器: \`${o.selector}\`
- 标签: ${o.label}
`,o.text&&(e+=`- 文本内容: "${o.text}"
`),e+=`- 修改项:
`;let s=1;for(const[r,{from:a,to:d}]of Object.entries(o.styleChanges))e+=`  ${s}. ${r}: ${a} → ${d}
`,s++;e+=`
`,t++}e+="请根据以上修改指令更新对应元素的 CSS 和 HTML 属性。",navigator.clipboard.writeText(e)}_exportJSON(){const e={version:1,url:location.href,timestamp:new Date().toISOString(),records:[...this.records.values()].map(s=>({id:s.id,selector:s.selector,label:s.label,text:s.text,frame:s.frame,styleChanges:s.styleChanges}))},t=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),o=document.createElement("a");o.href=URL.createObjectURL(t),o.download="pinpoint-export.json",o.click()}_importJSON(){const e=document.createElement("input");e.type="file",e.accept=".json",e.onchange=async()=>{const t=await e.files[0].text(),o=JSON.parse(t);for(const s of o.records){const r=document.querySelector(s.selector);if(r)for(const[a,{to:d}]of Object.entries(s.styleChanges))r.style.setProperty(a,d)}},e.click()}}function pe(i){if(i.id)return`#${CSS.escape(i.id)}`;const n=[];let e=i;for(;e&&e!==document.body;){let t=e.localName;if(e.id){n.unshift(`#${CSS.escape(e.id)}`);break}const o=[...e.classList].filter(s=>!s.startsWith("pinpoint-")).join(".");o&&(t+="."+o),n.unshift(t),e=e.parentElement}return n.join(" > ")}function he(i){let n=0;for(let e=0;e<i.length;e++)n=(n<<5)-n+i.charCodeAt(e)|0;return Math.abs(n).toString(36)}function T(i){const n=i.getBoundingClientRect();return{x:Math.round(n.left),y:Math.round(n.top),w:Math.round(n.width),h:Math.round(n.height)}}function ue(i){const n=new CSSStyleSheet;return n.replaceSync(i),n}customElements.define("pinpoint-overview",ce);function O(i,n){const e=document.elementsFromPoint(i,n);for(let t=e.length-1;t>=0;t--){const o=e[t];if(!me(o))return o}return null}function me(i){var n;return((n=i.localName)==null?void 0:n.startsWith("pinpoint-"))||i.closest("[data-pinpoint-ui]")}let C=!1;function fe(){C||(C=!0,document.addEventListener("mousemove",j),document.addEventListener("click",B))}function P(){C=!1,document.removeEventListener("mousemove",j),document.removeEventListener("click",B)}function j(i){const n=O(i.clientX,i.clientY);if(!n)return;const e=n.getBoundingClientRect();u("pinpoint:hover",{el:n,rect:e})}function B(i){if(i.target.closest("[data-pinpoint-ui]"))return;i.preventDefault(),i.stopPropagation();const n=O(i.clientX,i.clientY);if(!n)return;const e=n.getBoundingClientRect();u("pinpoint:selected",{els:[n],rects:[e]})}function ge(i){if(i.id)return`#${CSS.escape(i.id)}`;const n=[];let e=i;for(;e&&e!==document.body;){let t=e.localName;if(e.id){n.unshift(`#${CSS.escape(e.id)}`);break}const o=[...e.classList].filter(s=>!s.startsWith("pinpoint-")).join(".");o&&(t+="."+o),n.unshift(t),e=e.parentElement}return n.join(" > ")}function be(i,n){let e;return(...t)=>{clearTimeout(e),e=setTimeout(()=>i(...t),n)}}function z(i){let n=0;for(let e=0;e<i.length;e++)n=(n<<5)-n+i.charCodeAt(e)|0;return Math.abs(n).toString(36)}const w="pinpoint_state";function xe(i,n){const e={url:i,records:ye(n),timestamp:Date.now()};chrome.storage.local.set({[w+":"+i]:e})}const H=be(xe,500);async function ve(i){var e;return((e=(await chrome.storage.local.get(w+":"+i))[w+":"+i])==null?void 0:e.records)||null}function ye(i){const n={};for(const[e,t]of i)n[e]={...t,el:void 0};return n}const Ce=`:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}`;class we extends HTMLElement{constructor(){super();h(this,"_onMode",({detail:e})=>this._setMode(e.mode));h(this,"_onStyleChanged",({detail:e})=>{const{el:t,prop:o,from:s,to:r}=e;this.undoStack.push({el:t,prop:o,from:s,to:r}),this.undoStack.length>50&&this.undoStack.shift();const a=ge(t),d=z(a);this.records.has(d)||this.records.set(d,{id:d,selector:a,el:t,label:t.localName+(t.id?"#"+t.id:""),styleChanges:{}}),this.records.get(d).styleChanges[o]={from:s,to:r},H(location.href,this.records)});h(this,"_onReset",({detail:e})=>{const t=this.records.get(e.id);if(t){for(const[o,{from:s}]of Object.entries(t.styleChanges))s?t.el.style.setProperty(o,s):t.el.style.removeProperty(o);this.records.delete(e.id),H(location.href,this.records)}});h(this,"_onOverviewToggle",()=>{});h(this,"_onEditorPin",()=>{});h(this,"_onKey",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="z"){e.preventDefault();const t=this.undoStack.pop();if(!t)return;t.from?t.el.style.setProperty(t.prop,t.from):t.el.style.removeProperty(t.prop)}e.key==="Escape"&&u("pinpoint:selected",{els:[],rects:[]})});this.attachShadow({mode:"open"}),this.shadowRoot.adoptedStyleSheets=[Se(Ce)],this.setAttribute("data-pinpoint-ui",""),this.active=!1,this.mode="design",this.records=new Map,this.undoStack=[]}async connectedCallback(){this.shadowRoot.innerHTML="",this.shadowRoot.appendChild(document.createElement("pinpoint-toolbar")),this.shadowRoot.appendChild(document.createElement("pinpoint-hover")),this.shadowRoot.appendChild(document.createElement("pinpoint-selected")),this.shadowRoot.appendChild(document.createElement("pinpoint-editor")),this.shadowRoot.appendChild(document.createElement("pinpoint-color-popover")),this.shadowRoot.appendChild(document.createElement("pinpoint-overview")),m("pinpoint:mode",this._onMode),m("pinpoint:style-changed",this._onStyleChanged),m("pinpoint:style-reset",this._onReset),m("pinpoint:overview-toggle",this._onOverviewToggle),m("pinpoint:editor-pin",this._onEditorPin),document.addEventListener("keydown",this._onKey),this._setMode("design");const e=await ve(location.href);e&&this._restoreState(e)}disconnectedCallback(){f("pinpoint:mode",this._onMode),f("pinpoint:style-changed",this._onStyleChanged),f("pinpoint:style-reset",this._onReset),f("pinpoint:overview-toggle",this._onOverviewToggle),f("pinpoint:editor-pin",this._onEditorPin),document.removeEventListener("keydown",this._onKey),P()}_setMode(e){this.mode=e,e==="design"?fe():P(),e==="overview"?u("pinpoint:overview-toggle",{open:!0}):u("pinpoint:overview-toggle",{open:!1})}_restoreState(e){for(const[,t]of Object.entries(e)){const o=document.querySelector(t.selector);if(!o)continue;for(const[r,{to:a}]of Object.entries(t.styleChanges))o.style.setProperty(r,a);const s=z(t.selector);this.records.set(s,{...t,el:o})}}}function Se(i){const n=new CSSStyleSheet;return n.replaceSync(i),n}customElements.define("pinpoint-app",we);if(!document.querySelector("pinpoint-app")){const i=document.createElement("pinpoint-app");document.body.appendChild(i)}
})()
