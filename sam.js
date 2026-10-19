/* sam.js: all the motion of the samurai design, vanilla, no libraries (14.10.2026).
   Each part runs only if its markup is on the page. Nothing here writes words onto the page,
   except the heat number and the counter, which only count up to the number already in the copy. */
(function(){
  var d=document,w=window,root=d.documentElement,reduce=w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");
  function $$(s,c){ return [].slice.call((c||d).querySelectorAll(s)); }
  function onFrame(fn){ var on=0; return function(){ if(!on){ on=1; requestAnimationFrame(function(){ on=0; fn(); }); } }; }

  /* ---- reveal on scroll, with a safety net for anything already passed ---- */
  var revs=$$(".reveal,.gauge");
  var rio=new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("in"); rio.unobserve(e.target); } });
  },{threshold:.12,rootMargin:"0px 0px -6% 0px"});
  revs.forEach(function(el){ rio.observe(el); });
  var sweep=onFrame(function(){
    var lim=w.innerHeight*.94;
    revs.forEach(function(el){ if(!el.classList.contains("in")&&el.getBoundingClientRect().top<lim){ el.classList.add("in"); rio.unobserve(el); } });
  });
  w.addEventListener("scroll",sweep,{passive:true}); w.addEventListener("load",sweep);

  /* ---- counter: counts up to the number written in the copy ---- */
  var cio=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting) return; cio.unobserve(e.target);
      var el=e.target,target=+el.getAttribute("data-count"),t0=performance.now();
      if(reduce){ el.textContent=target.toLocaleString("en-US"); return; }
      (function step(now){
        var p=Math.min((now-t0)/1700,1),v=Math.round(target*(1-Math.pow(1-p,3)));
        el.textContent=v.toLocaleString("en-US"); if(p<1) requestAnimationFrame(step);
      })(t0);
    });
  },{threshold:.6});
  $$("[data-count]").forEach(function(el){ cio.observe(el); });

  /* ---- heat meter: 0 at the top, 100 when the goal ([data-heat-goal]) reaches the screen.
         Never goes down. Writes --heat on <html>, so the button glow and the ambient light warm up too ---- */
  var meter=d.querySelector("[data-heat]");
  if(meter){
    var degs=$$("[data-heat-deg]"),goalEl=d.querySelector("[data-heat-goal]"),cur=-1,goal=0;
    var measure=function(){ var max=root.scrollHeight-w.innerHeight; goal=goalEl?Math.min(max,goalEl.getBoundingClientRect().top+w.scrollY-w.innerHeight*.35):max; };
    var paint=function(){
      var h=goal>0?Math.max(0,Math.min(100,Math.round(w.scrollY/goal*100))):0;
      h=Math.max(h,cur); if(h===cur) return; cur=h;
      root.style.setProperty("--heat",h);
      degs.forEach(function(el){ el.textContent=h+"°"; });
    };
    var tickH=onFrame(paint);
    measure(); paint();
    w.addEventListener("scroll",tickH,{passive:true});
    w.addEventListener("resize",function(){ measure(); tickH(); });
    w.addEventListener("load",function(){ measure(); tickH(); });
    if("ResizeObserver" in w) new ResizeObserver(function(){ measure(); tickH(); }).observe(d.body);
    if(goalEl) new IntersectionObserver(function(es){ root.classList.toggle("heat-at-goal",es[0].isIntersecting); },{threshold:.04}).observe(goalEl);
  }

  /* ---- endless strip: dir 1 runs to the right, -1 to the left. pps = pixels per second.
         The box must be direction:ltr (an rtl box empties one side). ---- */
  function filmRun(box,track,pps,dir,draggable){
    if(!track) return;
    var set=[].slice.call(track.children),W=0,off=0,last=0,hover=false,drag=false,on=false,sx=0,sy=0,so=0,moved=false,seen=true;
    var norm=function(x){ return W?((x%W)+W)%W-W:0; };
    var fill=function(){
      while(track.children.length>set.length) track.removeChild(track.lastElementChild);
      var one=track.scrollWidth; if(one<10) return;
      var copies=Math.max(2,Math.ceil(w.innerWidth/one)+2);
      for(var c=1;c<copies;c++) set.forEach(function(n){ var k=n.cloneNode(true); k.setAttribute("aria-hidden","true"); $$("img",k).concat(k.tagName==="IMG"?[k]:[]).forEach(function(m){ m.alt=""; }); track.appendChild(k); });
      W=track.children[set.length].offsetLeft-track.children[0].offsetLeft;
      off=norm(off);
    };
    var frame=function(ts){
      var dt=last?Math.min(.1,(ts-last)/1000):0; last=ts;
      if(seen&&!hover&&!drag&&!reduce) off=norm(off+dir*pps*dt);
      if(seen) track.style.transform="translate3d("+off.toFixed(2)+"px,0,0)";
      requestAnimationFrame(frame);
    };
    fill(); requestAnimationFrame(frame);
    w.addEventListener("load",fill);
    if(d.fonts&&d.fonts.ready) d.fonts.ready.then(fill);
    var lastW=w.innerWidth; w.addEventListener("resize",function(){ if(w.innerWidth!==lastW){ lastW=w.innerWidth; fill(); } });
    new IntersectionObserver(function(es){
      seen=es[0].isIntersecting;
      if(seen) $$("img[loading=lazy]",track).forEach(function(m){ m.loading="eager"; });   /* off to the side never counts as near */
    },{rootMargin:"600px 0px"}).observe(box);
    if(!draggable) return;
    if(w.matchMedia("(hover:hover)").matches){
      box.addEventListener("mouseenter",function(){ hover=true; });
      box.addEventListener("mouseleave",function(){ hover=false; });
    }
    box.addEventListener("pointerdown",function(e){ if(e.pointerType==="mouse"&&e.button!==0) return; on=true; moved=false; sx=e.clientX; sy=e.clientY; so=off; });
    box.addEventListener("pointermove",function(e){
      if(!on) return; var dx=e.clientX-sx;
      if(!drag){ if(Math.abs(dx)<7||Math.abs(dx)<Math.abs(e.clientY-sy)) return; drag=true; moved=true; box.classList.add("drag"); try{ box.setPointerCapture(e.pointerId); }catch(err){} }
      off=norm(so+dx);
    });
    ["pointerup","pointercancel","lostpointercapture"].forEach(function(ev){ box.addEventListener(ev,function(){ on=false; drag=false; box.classList.remove("drag"); }); });
    box.addEventListener("click",function(e){ if(moved){ e.preventDefault(); e.stopPropagation(); moved=false; } },true);
    box.addEventListener("dragstart",function(e){ e.preventDefault(); });
  }
  $$("[data-strip]").forEach(function(b){ filmRun(b,b.firstElementChild,34,1,false); });
  $$("[data-film]").forEach(function(b){ filmRun(b,b.firstElementChild,w.innerWidth<761?28:40,+b.getAttribute("data-film")||1,true); });
  $$("[data-ribbon]").forEach(function(b){ filmRun(b,b.firstElementChild,60,-1,false); });

  /* ---- load early: images in a side rail or under a wipe never count as near on their own ---- */
  var nio=new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ $$("img[loading=lazy]",e.target).forEach(function(m){ m.loading="eager"; }); nio.unobserve(e.target); } });
  },{rootMargin:"800px 0px"});
  $$(".reels,.draw,[data-near]").forEach(function(el){ nio.observe(el); });

  /* ---- faq: one open at a time; the question in the middle of the screen opens by itself, until the first click ---- */
  $$("[data-faq]").forEach(function(list){
    var items=$$(".qa",list),manual=false;
    var set=function(it,open){ it.classList.toggle("open",open); it.querySelector(".qa__btn").setAttribute("aria-expanded",open?"true":"false"); };
    items.forEach(function(it){
      it.querySelector(".qa__btn").addEventListener("click",function(){
        manual=true; var was=it.classList.contains("open");
        items.forEach(function(o){ set(o,false); }); set(it,!was);
      });
    });
    if(reduce||!list.hasAttribute("data-autoopen")) return;
    var io=new IntersectionObserver(function(es){
      if(manual) return;
      es.forEach(function(e){ if(e.isIntersecting&&!e.target.classList.contains("open")) items.forEach(function(o){ set(o,o===e.target); }); });
    },{rootMargin:"-42% 0px -48% 0px"});
    items.forEach(function(it){ io.observe(it); });
  });

  /* ---- reels: a tile opens its clip in a dialog, with sound ---- */
  var modal=d.querySelector(".modal");
  if(modal&&modal.showModal){
    var vid=modal.querySelector("video");
    var close=function(){ if(modal.open) modal.close(); };
    modal.addEventListener("close",function(){ vid.pause(); vid.removeAttribute("src"); vid.load(); });
    modal.addEventListener("click",function(e){ if(e.target===modal) close(); });
    modal.querySelector(".modal__x").addEventListener("click",close);
    $$("[data-video]").forEach(function(b){
      b.addEventListener("click",function(){ vid.src=b.getAttribute("data-video"); vid.poster=(b.querySelector("img")||{}).src||""; modal.showModal(); var p=vid.play(); if(p&&p.catch) p.catch(function(){}); });
    });
  }

  /* ---- smooth jump only on a real click on an in-page link ---- */
  $$('a[href^="#"]').forEach(function(a){
    a.addEventListener("click",function(e){
      var t=d.getElementById(a.getAttribute("href").slice(1)); if(!t) return;
      e.preventDefault(); t.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
    });
  });

  /* DEMO ONLY: the form shows its thank-you line and goes nowhere.
     On a real page replace this block with the real checkout or lead submit. */
  $$("form[data-demo]").forEach(function(f){
    f.addEventListener("submit",function(e){ e.preventDefault(); var i=f.querySelector("input"); if(!i||i.checkValidity()) f.classList.add("sent"); else i.reportValidity(); });
  });
})();
