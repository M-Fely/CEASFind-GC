import"./modulepreload-polyfill-B5Qt9EMX.js";import{a as f}from"./db-CDNG_FJf.js";import{onAuthStateChanged as w}from"https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";import"https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";import"https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";import"https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";const y="modulepreload",x=function(n){return"/"+n},u={},v=function(e,t,p){let r=Promise.resolve();if(t&&t.length>0){let m=function(i){return Promise.all(i.map(c=>Promise.resolve(c).then(d=>({status:"fulfilled",value:d}),d=>({status:"rejected",reason:d}))))};document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),o=a?.nonce||a?.getAttribute("nonce");r=m(t.map(i=>{if(i=x(i),i in u)return;u[i]=!0;const c=i.endsWith(".css"),d=c?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${i}"]${d}`))return;const l=document.createElement("link");if(l.rel=c?"stylesheet":y,c||(l.as="script"),l.crossOrigin="",l.href=i,o&&l.setAttribute("nonce",o),document.head.appendChild(l),c)return new Promise((h,g)=>{l.addEventListener("load",h),l.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${i}`)))})}))}function s(a){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=a,window.dispatchEvent(o),!o.defaultPrevented)throw a}return r.then(a=>{for(const o of a||[])o.status==="rejected"&&s(o.reason);return e().catch(s)})};w(f,async n=>{if(!n){window.location.href="auth.html";return}n.email,document.getElementById("sidebar-username").textContent=n.displayName||n.email||"User",await b(n.email)});document.getElementById("logout-icon")?.addEventListener("click",async()=>{const{signOut:n}=await v(async()=>{const{signOut:e}=await import("https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js");return{signOut:e}},[]);await n(f),window.location.href="auth.html"});async function b(n){const e=document.getElementById("review-container");e.innerHTML="<p class='empty-msg'>Loading…</p>";try{const t=await fetch(`http://localhost:3000/item/history?userEmail=${encodeURIComponent(n)}`);if(!t.ok)throw new Error(await t.text());const r=(await t.json()).filter(o=>(o.status||"").toLowerCase()==="pending");if(r.length===0){e.innerHTML="<p class='empty-msg'>No pending claims to review.</p>";return}const s=await fetch("http://localhost:3000/claims"),a=s.ok?await s.json():[];e.innerHTML="";for(const o of r){const m=a.filter(i=>i.itemID===o.id&&(i.status||"").toLowerCase()==="pending");E(e,o,m)}}catch(t){console.error(t),e.innerHTML=`<p class='empty-msg'>Could not load reviews: ${t.message}</p>`}}function E(n,e,t){const p=t.length>0?t.map(s=>`
          <div style="background:#f9f9f9;border-radius:8px;padding:10px 14px;
                      margin-top:10px;border:1px solid var(--bg-white);">
            <p style="font-size:14px;font-weight:700;color:var(--night);">
              ${s.claimantName||"GC Student"}
            </p>
            <p style="font-size:12px;color:#666;">${s.claimantEmail||""}</p>
            <p style="font-size:13px;color:#444;margin-top:6px;">
              ${s.proofDescription||""}
            </p>
          </div>`).join(""):`<p style="font-size:13px;color:#999;margin-top:8px;font-style:italic;">
           No claim details on file.</p>`,r=document.createElement("div");r.className="review-post-card",r.innerHTML=`
      <div style="display:flex;gap:14px;align-items:flex-start;">
        <div style="width:65px;height:65px;flex-shrink:0;">
          ${e.img_url?`<img src="${e.img_url}"
                 style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`:`<div style="width:100%;height:100%;background:var(--bg-white);border-radius:8px;
                           display:flex;align-items:center;justify-content:center;">
                 <span class="material-symbols-outlined" style="font-size:22px;color:#ccc;">image</span>
               </div>`}
        </div>
        <div style="flex-grow:1;">
          <strong style="color:var(--night);font-size:16px;">${e.itemName||"Item"}</strong>
          <p style="font-size:13px;color:#666;margin-top:2px;">
            ${e.postType==="lost"?"Lost Item":"Found Item"} · ${e.category||""}
          </p>
          ${p}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;min-width:130px;align-items:flex-end;">
          <span style="background:#b45309;color:white;padding:6px 12px;border-radius:8px;
                       font-size:12px;font-weight:700;text-align:center;width:100%;">PENDING</span>
          <button onclick="markAsClaimed('${e.id}', this)"
            style="background:var(--night);color:white;border:none;cursor:pointer;
                   padding:7px 12px;border-radius:8px;font-size:12px;font-weight:700;
                   font-family:'Roboto Condensed';width:100%;">
            Mark as Claimed
          </button>
        </div>
      </div>
    `,n.appendChild(r)}window.markAsClaimed=async function(n,e){e.disabled=!0,e.innerText="Updating…";try{const t=await fetch(`http://localhost:3000/item/${n}/claim`,{method:"PUT"});if(!t.ok)throw new Error(await t.text());e.closest(".review-post-card").remove();const r=document.getElementById("review-container");r.querySelector(".review-post-card")||(r.innerHTML="<p class='empty-msg'>All claims have been processed.</p>")}catch(t){e.disabled=!1,e.innerText="Mark as Claimed",alert("Error: "+t.message)}};
