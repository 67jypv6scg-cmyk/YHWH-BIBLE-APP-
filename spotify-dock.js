/* Spotify Dock for the Bible app
   Add to your page, just before </body>:
   <script src="spotify-dock.js"></script>
   The redirect URI in the Spotify dashboard must match this page's address exactly. */
(() => {
  const CLIENT_ID = "59fc07791a5c4d3c80acd62d237d560e";
  const REDIRECT = location.origin + location.pathname;
  const SCOPES = "user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private";
  const API = "https://api.spotify.com/v1";
  const store = {
    get: k => { try { return localStorage.getItem("sd_" + k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem("sd_" + k, v); } catch {} },
    del: k => { try { localStorage.removeItem("sd_" + k); } catch {} }
  };

  // ---------- styles ----------
  const css = `
  #sd{position:fixed;left:0;right:0;bottom:0;z-index:9999;font-family:system-ui,-apple-system,sans-serif;
    background:#23302a;color:#f3f1ea;padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));
    box-shadow:0 -2px 12px rgba(0,0,0,.25)}
  #sd .row{display:flex;align-items:center;gap:10px;max-width:720px;margin:0 auto}
  #sd img{width:44px;height:44px;border-radius:4px;object-fit:cover;background:#3a4a41}
  #sd .meta{flex:1;min-width:0}
  #sd .t{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #sd .a{font-size:12px;opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #sd button{background:none;border:0;color:inherit;font-size:20px;width:40px;height:40px;border-radius:50%;cursor:pointer}
  #sd button:focus-visible{outline:2px solid #b9d38a}
  #sd .main{background:#b9d38a;color:#23302a}
  #sd .conn{width:auto;border-radius:20px;font-size:14px;font-weight:600;padding:0 16px;background:#b9d38a;color:#23302a}
  #sd .panel{max-width:720px;margin:10px auto 0;display:none}
  #sd.open .panel{display:block}
  #sd input[type=range]{width:100%;accent-color:#b9d38a}
  #sd .lists{max-height:40vh;overflow-y:auto;margin-top:8px}
  #sd .li{display:block;width:100%;text-align:left;font-size:14px;height:auto;border-radius:6px;padding:8px}
  #sd .li:hover{background:#3a4a41}
  #sd .msg{font-size:13px;opacity:.85;margin-top:6px}
  #sd .paste{display:flex;gap:6px;margin-top:8px}
  #sd .paste input{flex:1;padding:8px;border-radius:6px;border:0;font-size:14px}
  body{padding-bottom:84px}`;
  document.head.insertAdjacentHTML("beforeend", `<style>${css}</style>`);

  const dock = document.createElement("div");
  dock.id = "sd";
  document.body.appendChild(dock);

  // ---------- auth (PKCE, no server needed) ----------
  const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  async function login() {
    const verifier = b64(crypto.getRandomValues(new Uint8Array(64)));
    store.set("verifier", verifier);
    const challenge = b64(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
    location.href = "https://accounts.spotify.com/authorize?" + new URLSearchParams({
      client_id: CLIENT_ID, response_type: "code", redirect_uri: REDIRECT,
      code_challenge_method: "S256", code_challenge: challenge, scope: SCOPES
    });
  }
  async function tokenRequest(params) {
    const r = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: CLIENT_ID, ...params })
    });
    const j = await r.json();
    if (!j.access_token) throw new Error(j.error_description || "Sign-in failed");
    store.set("token", j.access_token);
    store.set("expires", Date.now() + j.expires_in * 1000 - 60000);
    if (j.refresh_token) store.set("refresh", j.refresh_token);
  }
  async function token() {
    if (store.get("token") && Date.now() < +store.get("expires")) return store.get("token");
    if (store.get("refresh")) {
      try { await tokenRequest({ grant_type: "refresh_token", refresh_token: store.get("refresh") }); return store.get("token"); }
      catch { logout(); }
    }
    return null;
  }
  function logout() { ["token", "expires", "refresh"].forEach(store.del); render(); }

  async function api(path, method = "GET", body) {
    const t = await token();
    if (!t) { render(); return null; }
    const r = await fetch(API + path, {
      method, headers: { Authorization: "Bearer " + t, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    if (r.status === 204) return {};
    if (r.status === 404) throw new Error("NO_DEVICE");
    if (r.status === 403) throw new Error("FORBIDDEN");
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json().catch(() => ({}));
  }

  // ---------- player ----------
  let state = null, msg = "";
  async function refresh() {
    try { state = await api("/me/player"); msg = state && state.item ? "" : "Open Spotify on your phone once, then press play here."; }
    catch (e) { msg = "Couldn't reach Spotify. Check your connection."; }
    render();
  }
  async function ensureDevice() {
    const d = await api("/me/player/devices");
    const dev = d && d.devices && (d.devices.find(x => x.is_active) || d.devices[0]);
    if (!dev) throw new Error("NO_DEVICE");
    if (!dev.is_active) await api("/me/player", "PUT", { device_ids: [dev.id], play: false });
    return dev.id;
  }
  async function act(fn) {
    try { await fn(); }
    catch (e) {
      if (e.message === "NO_DEVICE") {
        try { await ensureDevice(); await fn(); } catch { msg = "Open the Spotify app on your phone, then try again."; }
      } else if (e.message === "FORBIDDEN") msg = "Spotify blocked that action for this app.";
      else msg = "That didn't work. Try again.";
    }
    setTimeout(refresh, 400);
  }
  const playing = () => state && state.is_playing;
  const toggle = () => act(() => api("/me/player/" + (playing() ? "pause" : "play"), "PUT"));
  const next = () => act(() => api("/me/player/next", "POST"));
  const prev = () => act(() => api("/me/player/previous", "POST"));
  const volume = v => act(() => api("/me/player/volume?volume_percent=" + v, "PUT"));
  const playList = uri => { store.set("lastList", uri); act(() => api("/me/player/play", "PUT", { context_uri: uri })); };

  async function loadLists() {
    const box = dock.querySelector(".lists");
    box.innerHTML = '<div class="msg">Loading your playlists…</div>';
    try {
      const j = await api("/me/playlists?limit=50");
      box.innerHTML = "";
      (j.items || []).forEach(p => {
        const b = document.createElement("button");
        b.className = "li"; b.textContent = p.name;
        b.onclick = () => playList(p.uri);
        box.appendChild(b);
      });
      if (!box.children.length) box.innerHTML = '<div class="msg">No playlists found. Paste a playlist link below.</div>';
    } catch {
      box.innerHTML = '<div class="msg">Spotify doesn\'t allow this app to list playlists. Paste a playlist link below instead.</div>';
    }
  }
  function pasted(link) {
    const m = link.match(/(playlist|album)[/:]([A-Za-z0-9]+)/);
    if (!m) { msg = "That isn't a Spotify playlist or album link."; render(); return; }
    playList(`spotify:${m[1]}:${m[2]}`);
  }

  // ---------- render ----------
  function render() {
    const open = dock.classList.contains("open");
    if (!store.get("refresh") && !store.get("token")) {
      dock.innerHTML = `<div class="row"><div class="meta"><div class="t">Worship music</div><div class="a">Control Spotify while you read</div></div>
        <button class="conn">Connect Spotify</button></div>`;
      dock.querySelector(".conn").onclick = login;
      return;
    }
    const it = state && state.item;
    const art = it && it.album && it.album.images[0] ? it.album.images[it.album.images.length - 1].url : "";
    dock.innerHTML = `
      <div class="row">
        ${art ? `<img src="${art}" alt="">` : `<img alt="">`}
        <div class="meta"><div class="t">${it ? esc(it.name) : "Nothing playing"}</div>
          <div class="a">${it ? esc(it.artists.map(a => a.name).join(", ")) : esc(msg)}</div></div>
        <button aria-label="Previous" data-a="prev">⏮</button>
        <button class="main" aria-label="${playing() ? "Pause" : "Play"}" data-a="toggle">${playing() ? "⏸" : "▶"}</button>
        <button aria-label="Next" data-a="next">⏭</button>
        <button aria-label="More" data-a="more">${open ? "▾" : "▴"}</button>
      </div>
      <div class="panel">
        <label class="a">Volume</label>
        <input type="range" min="0" max="100" value="${state && state.device ? state.device.volume_percent ?? 50 : 50}">
        ${it && msg ? `<div class="msg">${esc(msg)}</div>` : ""}
        <div class="lists"></div>
        <div class="paste"><input placeholder="Paste a Spotify playlist link"><button class="li" style="width:auto">Play</button></div>
        <button class="li" data-a="logout" style="opacity:.7;margin-top:6px">Disconnect Spotify</button>
      </div>`;
    const acts = { prev, next, toggle, logout,
      more: () => { dock.classList.toggle("open"); render(); if (dock.classList.contains("open")) loadLists(); } };
    dock.querySelectorAll("[data-a]").forEach(b => b.onclick = acts[b.dataset.a]);
    dock.querySelector("input[type=range]").onchange = e => volume(e.target.value);
    const inp = dock.querySelector(".paste input");
    dock.querySelector(".paste button").onclick = () => pasted(inp.value.trim());
  }
  const esc = s => String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- start ----------
  (async () => {
    const code = new URLSearchParams(location.search).get("code");
    if (code) {
      try { await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: REDIRECT, code_verifier: store.get("verifier") }); }
      catch (e) { msg = e.message; }
      history.replaceState(null, "", REDIRECT + location.hash);
    }
    render();
    if (await token()) { refresh(); setInterval(() => { if (!document.hidden) refresh(); }, 5000); }
  })();
})();
