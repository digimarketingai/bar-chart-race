(function () {
  'use strict';

  const CSS = `
body{margin:0;min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;
  background:#060a14;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;padding:16px;gap:20px}
force-graph{display:block;position:relative;overflow:hidden;border-radius:16px;
  box-shadow:0 0 0 1px rgba(255,255,255,.06),0 30px 70px -12px rgba(0,0,0,.7),0 0 100px -30px rgba(99,102,241,.12);
  font-family:'Segoe UI',system-ui,-apple-system,sans-serif;user-select:none;-webkit-user-select:none}
force-graph svg{display:block;width:100%;height:100%}
force-graph .fg-toolbar{position:absolute;top:12px;right:12px;display:flex;gap:7px;z-index:10}
force-graph .fg-btn{background:rgba(255,255,255,.06);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border:1px solid rgba(255,255,255,.1);color:#94a3b8;padding:5px 13px;border-radius:8px;cursor:pointer;
  font-size:12px;font-weight:500;transition:all .2s ease;letter-spacing:.3px}
force-graph .fg-btn:hover{background:rgba(255,255,255,.13);border-color:rgba(255,255,255,.22);color:#e2e8f0}
force-graph .fg-hd{position:absolute;top:14px;left:20px;z-index:10;pointer-events:none}
force-graph .fg-hd h2{color:#f1f5f9;font-size:17px;font-weight:700;letter-spacing:.3px;margin:0;
  text-shadow:0 2px 14px rgba(0,0,0,.6)}
force-graph .fg-hd p{color:#4b5e78;font-size:11.5px;margin:3px 0 0}
force-graph .fg-tip{position:absolute;background:rgba(10,16,30,.94);backdrop-filter:blur(14px);
  -webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.09);border-radius:12px;
  padding:14px 18px;color:#cbd5e1;font-size:13px;pointer-events:none;opacity:0;transition:opacity .15s;
  z-index:30;max-width:260px;box-shadow:0 14px 44px rgba(0,0,0,.55)}
force-graph .fg-tip.show{opacity:1}
force-graph .fg-legend{position:absolute;bottom:12px;left:16px;display:flex;gap:14px;flex-wrap:wrap;z-index:10}
force-graph .fg-legend i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:middle}
force-graph .fg-legend span{color:#4b5e78;font-size:11px}
force-graph .fg-hint{position:absolute;bottom:10px;right:14px;color:#374151;font-size:10.5px;z-index:10;pointer-events:none;text-align:right;line-height:1.5}
force-graph .fg-hint b{color:#6366f1;font-weight:500}
graph-node,graph-edge{display:none!important}
`;
  document.head.appendChild(Object.assign(document.createElement('style'),{textContent:CSS}));

  const COLORS=['#6366f1','#ec4899','#14b8a6','#f59e0b','#8b5cf6','#ef4444','#22c55e','#3b82f6','#f97316','#a855f7','#06b6d4','#84cc16','#e11d48','#0ea5e9','#d946ef'];
  const GRADS=[['#6366f1','#818cf8'],['#ec4899','#f472b6'],['#14b8a6','#2dd4bf'],['#f59e0b','#fbbf24'],['#8b5cf6','#a78bfa'],['#ef4444','#f87171'],['#22c55e','#4ade80'],['#3b82f6','#60a5fa'],['#f97316','#fb923c'],['#a855f7','#c084fc'],['#06b6d4','#22d3ee'],['#84cc16','#a3e635'],['#e11d48','#fb7185'],['#0ea5e9','#38bdf8'],['#d946ef','#e879f9']];

  const S=(t,a)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',t);if(a)Object.entries(a).forEach(([k,v])=>e.setAttribute(k,v));return e};
  const rgba=(hex,a)=>{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return`rgba(${r},${g},${b},${a})`};

  class ForceGraph{
    constructor(el){
      this.el=el;this.nodes=[];this.edges=[];this.nodeMap={};
      this.drag=null;this.hover=null;this.lang=0;this.alpha=1;this.live=true;
      this.cfg={
        w:+el.getAttribute('width')||960,h:+el.getAttribute('height')||600,
        r:+el.getAttribute('node-radius')||30,
        repulse:+(el.getAttribute('repulsion'))||1500,
        attract:+(el.getAttribute('attraction'))||0.007,
        damp:+(el.getAttribute('damping'))||0.82,
        grav:+(el.getAttribute('gravity'))||0.04,
        ideal:+(el.getAttribute('ideal-length'))||170,
      };
      this._parse();this._dom();this._svg();this._events();this._loop();
    }

    _parse(){
      const c=this.cfg;
      this.el.querySelectorAll('graph-node').forEach((e,i)=>{
        const id=e.getAttribute('id')||e.getAttribute('node-id')||'n'+i;
        const n={
          id,label:e.getAttribute('label')||id,label2:e.getAttribute('label2')||'',
          image:e.getAttribute('image')||'',group:+(e.getAttribute('group'))||0,
          desc:e.getAttribute('desc')||'',r:+(e.getAttribute('radius'))||c.r,
          x:c.w/2+(Math.random()-.5)*c.w*.45,y:c.h/2+(Math.random()-.5)*c.h*.45,
          vx:0,vy:0,dragging:false,pinned:false
        };
        this.nodes.push(n);this.nodeMap[id]=n;
      });
      const pc={};
      this.el.querySelectorAll('graph-edge').forEach(e=>{
        const ed={
          source:e.getAttribute('source'),target:e.getAttribute('target'),
          label:e.getAttribute('label')||'',label2:e.getAttribute('label2')||'',
          strength:+(e.getAttribute('strength'))||1,
          style:e.getAttribute('edge-style')||'solid',
          directed:e.getAttribute('directed')==='true',
          color:e.getAttribute('color')||'',
        };
        const k=[ed.source,ed.target].sort().join('|');
        pc[k]=(pc[k]||0)+1;ed._pk=k;this.edges.push(ed);
      });
      const pi={};
      this.edges.forEach(ed=>{pi[ed._pk]=pi[ed._pk]||0;ed._ci=pi[ed._pk];ed._ct=pc[ed._pk];pi[ed._pk]++});
    }

    _dom(){
      const el=this.el,c=this.cfg;
      el.style.width='100%';el.style.maxWidth=c.w+'px';el.style.height=c.h+'px';
      el.style.background='linear-gradient(140deg,#0c1222 0%,#141b2e 35%,#171735 65%,#0c1222 100%)';

      const title=el.getAttribute('title'),sub=el.getAttribute('subtitle');
      if(title){const hd=document.createElement('div');hd.className='fg-hd';
        hd.innerHTML=`<h2>${title}</h2>${sub?'<p>'+sub+'</p>':''}`;el.appendChild(hd)}

      const hasL2=this.nodes.some(n=>n.label2)||this.edges.some(e=>e.label2);
      const tb=document.createElement('div');tb.className='fg-toolbar';
      if(hasL2){const b1=document.createElement('button');b1.className='fg-btn';b1.textContent='\u{1F310} Lang';
        b1.onclick=()=>{this.lang=(this.lang+1)%3;this._labels()};tb.appendChild(b1)}
      const b2=document.createElement('button');b2.className='fg-btn';b2.textContent='\u27F3 Reset';
      b2.onclick=()=>this._reset();tb.appendChild(b2);el.appendChild(tb);

      this.tip=document.createElement('div');this.tip.className='fg-tip';el.appendChild(this.tip);

      const groups=[...new Set(this.nodes.map(n=>n.group))].sort((a,b)=>a-b);
      if(groups.length>1){
        const lg=document.createElement('div');lg.className='fg-legend';
        const gNames=(el.getAttribute('group-names')||'').split(',');
        groups.forEach(g=>{const s=document.createElement('span');
          const name=(gNames[g]||'').trim()||('Group '+g);
          s.innerHTML=`<i style="background:${COLORS[g%COLORS.length]}"></i>${name}`;lg.appendChild(s)});
        el.appendChild(lg);
      }

      const hint=document.createElement('div');hint.className='fg-hint';
      hint.innerHTML='<b>Drag</b> nodes \u00b7 <b>Hover</b> for info \u00b7 <b>Dbl-click</b> pin/unpin';
      el.appendChild(hint);
    }

    _svg(){
      const c=this.cfg;
      const svg=S('svg',{viewBox:`0 0 ${c.w} ${c.h}`,preserveAspectRatio:'xMidYMid meet'});
      const defs=S('defs');

      const mkF=(id,fn)=>{const f=S('filter',{id,x:'-50%',y:'-50%',width:'200%',height:'200%'});fn(f);defs.appendChild(f)};
      mkF('fg-glow',f=>{f.appendChild(S('feGaussianBlur',{stdDeviation:'4',result:'b'}));
        const m=S('feMerge');m.appendChild(S('feMergeNode',{in:'b'}));m.appendChild(S('feMergeNode',{in:'SourceGraphic'}));f.appendChild(m)});
      mkF('fg-shadow',f=>{f.appendChild(S('feDropShadow',{dx:'0',dy:'3',stdDeviation:'5','flood-color':'rgba(0,0,0,.4)','flood-opacity':'1'}))});

      GRADS.forEach((cols,i)=>{const g=S('linearGradient',{id:'fg-g'+i,x1:'0%',y1:'0%',x2:'100%',y2:'100%'});
        g.appendChild(S('stop',{offset:'0%','stop-color':cols[0]}));
        g.appendChild(S('stop',{offset:'100%','stop-color':cols[1]}));defs.appendChild(g)});

      this.nodes.forEach(n=>{if(n.image){const cp=S('clipPath',{id:'fg-cp-'+n.id});
        cp.appendChild(S('circle',{cx:'0',cy:'0',r:''+(n.r-2.5)}));defs.appendChild(cp)}});

      const rg=S('radialGradient',{id:'fg-rbg',cx:'50%',cy:'50%',r:'60%'});
      rg.appendChild(S('stop',{offset:'0%','stop-color':'rgba(99,102,241,.035)'}));
      rg.appendChild(S('stop',{offset:'100%','stop-color':'transparent'}));defs.appendChild(rg);
      svg.appendChild(defs);

      const bg=S('g');
      for(let x=0;x<=c.w;x+=50)bg.appendChild(S('line',{x1:x,y1:0,x2:x,y2:c.h,stroke:'rgba(100,120,160,.04)','stroke-width':'1'}));
      for(let y=0;y<=c.h;y+=50)bg.appendChild(S('line',{x1:0,y1:y,x2:c.w,y2:y,stroke:'rgba(100,120,160,.04)','stroke-width':'1'}));
      svg.appendChild(bg);svg.appendChild(S('rect',{width:c.w,height:c.h,fill:'url(#fg-rbg)'}));

      this.gE=S('g');svg.appendChild(this.gE);
      this.gL=S('g');svg.appendChild(this.gL);
      this.gN=S('g');svg.appendChild(this.gN);

      this.edEls=[];this.lbEls=[];
      this.edges.forEach(ed=>{
        const s=this.nodeMap[ed.source],t=this.nodeMap[ed.target];
        if(!s||!t){this.edEls.push(null);this.lbEls.push(null);return}
        const col=ed.color||COLORS[s.group%COLORS.length];
        const p=S('path',{fill:'none',stroke:rgba(col,.3),
          'stroke-width':''+(1+ed.strength*.9),'stroke-linecap':'round',
          'stroke-dasharray':ed.style==='dashed'?'9,5':ed.style==='dotted'?'3,4':'none'});
        this.gE.appendChild(p);this.edEls.push(p);
        if(ed.label||ed.label2){
          const g=S('g');const bg2=S('rect',{rx:'5',ry:'5',fill:'rgba(10,16,30,.85)',stroke:'rgba(100,120,160,.12)','stroke-width':'.5'});
          const tx=S('text',{'text-anchor':'middle','dominant-baseline':'central',fill:'#7a8ba8','font-size':'10','font-family':'system-ui,sans-serif','font-weight':'500'});
          g.appendChild(bg2);g.appendChild(tx);this.gL.appendChild(g);this.lbEls.push({g,bg:bg2,tx,ed});
        }else{this.lbEls.push(null)}
      });

      this.ndEls=[];
      this.nodes.forEach(n=>{
        const g=S('g',{cursor:'grab'});const col=COLORS[n.group%COLORS.length];const gid='fg-g'+(n.group%GRADS.length);
        const halo=S('circle',{r:''+(n.r+12),fill:rgba(col,0),opacity:'0'});g.appendChild(halo);

        if(n.image){
          g.appendChild(S('circle',{r:''+n.r,fill:'#151d30',filter:'url(#fg-shadow)'}));
          g.appendChild(S('image',{href:n.image,x:''+(-(n.r-2.5)),y:''+(-(n.r-2.5)),
            width:''+((n.r-2.5)*2),height:''+((n.r-2.5)*2),
            'clip-path':'url(#fg-cp-'+n.id+')',preserveAspectRatio:'xMidYMid slice'}));
          g.appendChild(S('circle',{r:''+(n.r-1),fill:'none',stroke:col,'stroke-width':'2.5'}));
          g.appendChild(S('circle',{r:''+(n.r+1),fill:'none',stroke:rgba(col,.15),'stroke-width':'1'}));
        }else{
          g.appendChild(S('circle',{r:''+n.r,fill:'url(#'+gid+')',filter:'url(#fg-shadow)'}));
          g.appendChild(S('circle',{r:''+(n.r-2),fill:'none',stroke:'rgba(255,255,255,.18)','stroke-width':'1'}));
          const init=S('text',{'text-anchor':'middle','dominant-baseline':'central',
            fill:'#fff','font-size':''+(n.r*.72),'font-weight':'700','font-family':'system-ui,sans-serif',opacity:'.9'});
          init.textContent=(n.label2||n.label||'?')[0];g.appendChild(init);
        }

        const ly=n.r+16;
        const n1=S('text',{y:''+ly,'text-anchor':'middle',fill:'#e2e8f0','font-size':'12.5','font-weight':'600',
          'font-family':'system-ui,sans-serif','paint-order':'stroke',stroke:'rgba(10,16,30,.95)','stroke-width':'4','stroke-linejoin':'round'});
        const n2=S('text',{y:''+(ly+15),'text-anchor':'middle',fill:'#64748b','font-size':'10.5',
          'font-family':'system-ui,sans-serif','paint-order':'stroke',stroke:'rgba(10,16,30,.95)','stroke-width':'3.5','stroke-linejoin':'round'});
        g.appendChild(n1);g.appendChild(n2);
        this.gN.appendChild(g);this.ndEls.push({g,halo,n1,n2,node:n});n._g=g;n._halo=halo;
      });

      this.el.appendChild(svg);this.svg=svg;this._labels();
    }

    _labels(){
      this.ndEls.forEach(({n1,n2,node:n})=>{
        if(this.lang===0){n1.textContent=n.label;n2.textContent=n.label2}
        else if(this.lang===1){n1.textContent=n.label;n2.textContent=''}
        else{n1.textContent=n.label2||n.label;n2.textContent=''}
      });
      this.lbEls.forEach(item=>{if(!item)return;const e=item.ed;
        if(this.lang===0)item.tx.textContent=e.label+(e.label2?' / '+e.label2:'');
        else if(this.lang===1)item.tx.textContent=e.label;
        else item.tx.textContent=e.label2||e.label});
    }

    _reset(){
      const c=this.cfg;
      this.nodes.forEach(n=>{n.x=c.w/2+(Math.random()-.5)*c.w*.45;n.y=c.h/2+(Math.random()-.5)*c.h*.45;n.vx=0;n.vy=0;n.pinned=false});
      this.alpha=1;if(!this.live){this.live=true;this._loop()}
    }

    _events(){
      let ox=0,oy=0;
      const pos=e=>{const r=this.svg.getBoundingClientRect();const cx=e.touches?e.touches[0].clientX:e.clientX;const cy=e.touches?e.touches[0].clientY:e.clientY;
        return{x:(cx-r.left)/r.width*this.cfg.w,y:(cy-r.top)/r.height*this.cfg.h}};
      const hit=p=>{for(let i=this.nodes.length-1;i>=0;i--){const n=this.nodes[i];if((p.x-n.x)**2+(p.y-n.y)**2<(n.r+10)**2)return n}return null};

      const down=e=>{const p=pos(e),n=hit(p);
        if(n){this.drag=n;n.dragging=true;ox=n.x-p.x;oy=n.y-p.y;n._g.style.cursor='grabbing';
          this.alpha=Math.max(this.alpha,.4);if(!this.live){this.live=true;this._loop()}e.preventDefault()}};
      const move=e=>{const p=pos(e);
        if(this.drag){const c=this.cfg;
          this.drag.x=Math.max(this.drag.r,Math.min(c.w-this.drag.r,p.x+ox));
          this.drag.y=Math.max(this.drag.r,Math.min(c.h-this.drag.r,p.y+oy));
          this.drag.vx=0;this.drag.vy=0;e.preventDefault();
        }else{
          const n=hit(p);if(n!==this.hover){if(this.hover)this._hout();if(n)this._hin(n);this.hover=n}
          if(this.hover){const r=this.el.getBoundingClientRect();const cx=e.clientX||0,cy=e.clientY||0;
            let tx=cx-r.left+18,ty=cy-r.top+18;if(tx+250>r.width)tx=cx-r.left-260;if(ty+100>r.height)ty=cy-r.top-110;
            this.tip.style.left=tx+'px';this.tip.style.top=ty+'px'}
        }};
      const up=()=>{if(this.drag){this.drag.dragging=false;this.drag.pinned=true;this.drag._g.style.cursor='grab';this.drag=null}};

      this.svg.addEventListener('mousedown',down);
      this.svg.addEventListener('touchstart',down,{passive:false});
      window.addEventListener('mousemove',move);
      window.addEventListener('touchmove',move,{passive:false});
      window.addEventListener('mouseup',up);
      window.addEventListener('touchend',up);
      this.svg.addEventListener('dblclick',e=>{const n=hit(pos(e));if(n){n.pinned=!n.pinned;this.alpha=Math.max(this.alpha,.3);
        if(!this.live){this.live=true;this._loop()}}});
      this.el.addEventListener('mouseleave',()=>{if(this.hover){this._hout();this.hover=null}});
    }

    _hin(node){
      const col=COLORS[node.group%COLORS.length];
      node._halo.setAttribute('fill',rgba(col,.18));node._halo.setAttribute('opacity','1');
      const conn=new Set([node.id]);
      this.edges.forEach((ed,i)=>{
        if(ed.source===node.id||ed.target===node.id){conn.add(ed.source);conn.add(ed.target);
          if(this.edEls[i]){const ec=ed.color||COLORS[this.nodeMap[ed.source].group%COLORS.length];
            this.edEls[i].setAttribute('stroke',rgba(ec,.8));this.edEls[i].setAttribute('stroke-width',''+(2.5+ed.strength))}
        }else{if(this.edEls[i])this.edEls[i].setAttribute('opacity','.06')}
      });
      this.ndEls.forEach(({g,node:n})=>{g.style.opacity=conn.has(n.id)?'1':'.15';g.style.transition='opacity .15s'});

      let h=`<div style="font-weight:700;font-size:15px;color:${col};margin-bottom:2px">${node.label}</div>`;
      if(node.label2)h+=`<div style="font-size:12px;color:#4b5e78;margin-bottom:5px">${node.label2}</div>`;
      if(node.desc)h+=`<div style="font-size:12px;margin-bottom:6px;color:#94a3b8">${node.desc}</div>`;
      const rels=this.edges.filter(e=>e.source===node.id||e.target===node.id);
      if(rels.length){h+=`<div style="border-top:1px solid rgba(255,255,255,.07);padding-top:7px;margin-top:3px">`;
        rels.forEach(r=>{const oid=r.source===node.id?r.target:r.source;const o=this.nodeMap[oid];if(!o)return;
          const rl=this.lang===2?(r.label2||r.label):r.label;const on=this.lang===2?(o.label2||o.label):o.label;
          h+=`<div style="font-size:11.5px;margin:3px 0;color:#64748b">\u2192 <span style="color:#94a3b8">${on}</span>: ${rl}</div>`});
        h+=`</div>`}
      this.tip.innerHTML=h;this.tip.classList.add('show');
    }

    _hout(){
      if(this.hover)this.hover._halo.setAttribute('opacity','0');
      this.edges.forEach((ed,i)=>{if(!this.edEls[i])return;const s=this.nodeMap[ed.source];if(!s)return;
        const col=ed.color||COLORS[s.group%COLORS.length];
        this.edEls[i].setAttribute('stroke',rgba(col,.3));this.edEls[i].setAttribute('stroke-width',''+(1+ed.strength*.9));this.edEls[i].setAttribute('opacity','1')});
      this.ndEls.forEach(({g})=>{g.style.opacity='1'});this.tip.classList.remove('show');
    }

    _tick(){
      const{repulse,attract,damp,grav,ideal,w,h}=this.cfg;const N=this.nodes,a=this.alpha;
      for(let i=0;i<N.length;i++)for(let j=i+1;j<N.length;j++){
        let dx=N[j].x-N[i].x,dy=N[j].y-N[i].y;let d2=dx*dx+dy*dy;if(d2<1)d2=1;
        let d=Math.sqrt(d2),f=repulse*a/d2;let fx=dx/d*f,fy=dy/d*f;
        if(!N[i].dragging&&!N[i].pinned){N[i].vx-=fx;N[i].vy-=fy}
        if(!N[j].dragging&&!N[j].pinned){N[j].vx+=fx;N[j].vy+=fy}}
      this.edges.forEach(ed=>{const s=this.nodeMap[ed.source],t=this.nodeMap[ed.target];if(!s||!t)return;
        let dx=t.x-s.x,dy=t.y-s.y,d=Math.sqrt(dx*dx+dy*dy)||1;let f=(d-ideal)*attract*ed.strength*a;
        let fx=dx/d*f,fy=dy/d*f;
        if(!s.dragging&&!s.pinned){s.vx+=fx;s.vy+=fy}if(!t.dragging&&!t.pinned){t.vx-=fx;t.vy-=fy}});
      N.forEach(n=>{if(n.dragging||n.pinned)return;n.vx+=(w/2-n.x)*grav*a;n.vy+=(h/2-n.y)*grav*a});
      N.forEach(n=>{if(n.dragging||n.pinned)return;n.vx*=damp;n.vy*=damp;n.x+=n.vx;n.y+=n.vy;
        const pad=n.r+30;n.x=Math.max(pad,Math.min(w-pad,n.x));n.y=Math.max(pad,Math.min(h-pad,n.y))});
    }

    _render(){
      this.ndEls.forEach(({g,node:n})=>{g.setAttribute('transform',`translate(${n.x.toFixed(1)},${n.y.toFixed(1)})`)});
      this.edges.forEach((ed,i)=>{
        const el=this.edEls[i];if(!el)return;
        const s=this.nodeMap[ed.source],t=this.nodeMap[ed.target];if(!s||!t)return;
        const dx=t.x-s.x,dy=t.y-s.y,d=Math.sqrt(dx*dx+dy*dy)||1;
        let curve=0;if(ed._ct>1)curve=(ed._ci-(ed._ct-1)/2)*50;
        const sr=s.r+3,tr=t.r+3;
        const sx=s.x+dx/d*sr,sy=s.y+dy/d*sr,tx=t.x-dx/d*tr,ty=t.y-dy/d*tr;
        if(Math.abs(curve)<1){el.setAttribute('d',`M${sx.toFixed(1)},${sy.toFixed(1)}L${tx.toFixed(1)},${ty.toFixed(1)}`)}
        else{const mx=(s.x+t.x)/2,my=(s.y+t.y)/2,nx=-dy/d,ny=dx/d;
          el.setAttribute('d',`M${sx.toFixed(1)},${sy.toFixed(1)}Q${(mx+nx*curve).toFixed(1)},${(my+ny*curve).toFixed(1)} ${tx.toFixed(1)},${ty.toFixed(1)}`)}
        const lb=this.lbEls[i];if(!lb)return;
        const mx=(s.x+t.x)/2,my=(s.y+t.y)/2,nx=-dy/d,ny=dx/d;
        const off=Math.abs(curve)<1?(d>120?-12:0):curve*.45;
        const lx=mx+nx*off,ly=my+ny*off;
        lb.tx.setAttribute('x',lx.toFixed(1));lb.tx.setAttribute('y',ly.toFixed(1));
        try{const bb=lb.tx.getBBox();if(bb.width>0){lb.bg.setAttribute('x',bb.x-6);lb.bg.setAttribute('y',bb.y-2);
          lb.bg.setAttribute('width',bb.width+12);lb.bg.setAttribute('height',bb.height+4)}}catch(e){}
      });
    }

    _loop(){
      if(!this.live)return;this._tick();this._render();
      if(!this.drag){this.alpha=Math.max(.004,this.alpha-.0025);
        if(this.alpha<=.005){let tv=0;this.nodes.forEach(n=>tv+=Math.abs(n.vx)+Math.abs(n.vy));if(tv<.05){this.live=false;return}}}
      requestAnimationFrame(()=>this._loop());
    }
  }

  const boot=()=>document.querySelectorAll('force-graph').forEach(el=>{if(!el._fg)el._fg=new ForceGraph(el)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else setTimeout(boot,0);
  window.ForceGraph=ForceGraph;
})();
