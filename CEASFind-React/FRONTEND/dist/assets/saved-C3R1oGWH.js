import"./modulepreload-polyfill-B5Qt9EMX.js";import{a as l}from"./db-CDNG_FJf.js";import{onAuthStateChanged as u,signOut as h}from"https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";import"https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";import"https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";import"https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";const v={unclaimed:"#3f51b5",claimed:"#0ea5e9",pending:"#f59e0b",synced:"#22c55e",searching:"#6b7280"};let n=[],m=null;u(l,async t=>{if(!t){window.location.href="auth.html";return}m=t.uid,document.getElementById("sidebar-username").textContent=t.displayName||t.email||"User",await g(t.uid)});document.getElementById("logout-icon").addEventListener("click",async()=>{confirm("Log out?")&&(await h(l),window.location.href="auth.html")});async function g(t){const a=document.getElementById("saved-feed-container");try{const e=await fetch(`http://localhost:3000/saved?uid=${encodeURIComponent(t)}`);if(!e.ok)throw new Error("Could not load bookmarks.");const o=await e.json();if(o.length===0){a.innerHTML='<p class="empty-msg">No bookmarks yet.<br/>Hit the bookmark button on any item to save it here.</p>',document.getElementById("stats-text").textContent="0 bookmarked items";return}n=(await Promise.allSettled(o.map(s=>fetch(`http://localhost:3000/item/${s}`).then(i=>i.ok?i.json():null)))).map(s=>s.status==="fulfilled"?s.value:null).filter(Boolean),document.getElementById("stats-text").textContent=`${n.length} bookmarked item${n.length!==1?"s":""}`,r(n)}catch(e){console.error(e),a.innerHTML=`<p class="empty-msg">Failed to load bookmarks: ${e.message}</p>`}}function r(t){const a=document.getElementById("saved-feed-container");if(a.innerHTML="",t.length===0){a.innerHTML='<p class="empty-msg">No matching bookmarks.</p>';return}t.forEach(e=>{const o=(e.status||"unclaimed").toLowerCase(),c=o.charAt(0).toUpperCase()+o.slice(1),s=v[o]||"#8e8e8e",i=e.createdAt?.seconds?new Date(e.createdAt.seconds*1e3).toLocaleDateString("en-PH",{year:"numeric",month:"short",day:"numeric"}):"",d=document.createElement("div");d.className="saved-card",d.innerHTML=`
            ${e.img_url?`<img class="saved-card-img" src="${e.img_url}" alt="${e.itemName}" />`:""}

            <div class="saved-card-body">
              <div class="saved-card-thumb">
                ${e.img_url?`<img src="${e.img_url}" alt="" />`:'<span class="material-symbols-outlined" style="color:#ccc; font-size:22px; min-width:unset;">image</span>'}
              </div>

              <div class="saved-card-info">
                <div class="item-name">${e.itemName||"Unknown Item"}</div>
                <div class="item-meta">
                  ${e.category||""}
                  ${e.foundLocation||e.lostLocation?`· ${e.foundLocation||e.lostLocation}`:""}
                  ${i?`· ${i}`:""}
                </div>
                <div class="item-reporter">
                  By <strong>${e.reporterName||"Unknown"}</strong>
                  · ${e.postType==="lost"?"Lost Item":"Found Item"}
                </div>
              </div>

              <div class="saved-card-actions">
                <span class="status-pill" style="background:${s};">${c}</span>
                <div class="card-btn-row">
                  <button class="btn-view"
                    onclick="window.location.href='proof-page.html?postId=${e.id}'">
                    Claim / View
                  </button>
                  <button class="btn-unsave" title="Remove bookmark"
                    onclick="unsaveItem('${e.id}', this)">
                    <span class="material-symbols-outlined">bookmark_remove</span>
                  </button>
                </div>
              </div>
            </div>
          `,a.appendChild(d)})}window.unsaveItem=async(t,a)=>{if(confirm("Remove this bookmark?")){a.disabled=!0;try{const e=await fetch(`http://localhost:3000/saved/${t}?uid=${encodeURIComponent(m)}`,{method:"DELETE"});if(!e.ok)throw new Error(await e.text());n=n.filter(o=>o.id!==t),document.getElementById("stats-text").textContent=`${n.length} bookmarked item${n.length!==1?"s":""}`,r(n)}catch(e){console.error(e),alert("Failed to remove bookmark: "+e.message),a.disabled=!1}}};document.getElementById("search-box").addEventListener("input",t=>{const a=t.target.value.toLowerCase().trim();if(!a){r(n);return}const e=n.filter(o=>(o.itemName||"").toLowerCase().includes(a)||(o.category||"").toLowerCase().includes(a)||(o.description||"").toLowerCase().includes(a)||(o.reporterName||"").toLowerCase().includes(a));r(e)});
