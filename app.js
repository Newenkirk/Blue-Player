const DB_NAME = "blueplayer_db";
const STORE_TRACKS = "tracks";
const STORE_PLAYLISTS = "playlists";

/* ===== Preferences (persistent) ===== */
const PREF_KEY = "bp_prefs_v1";
const PREF_DEFAULTS = {
  newenkirk: false,
  sounds: true,
  anims: true,
  speed: 1
};
let prefs = { ...PREF_DEFAULTS };

function loadPrefs(){
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object") {
      prefs = { ...PREF_DEFAULTS, ...obj };
    }
  } catch {}
}

function savePrefs(){
  try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch {}
}

function applyPrefs(){
  document.body.classList.toggle("newenkirkOn", !!prefs.newenkirk);
  document.body.classList.toggle("animOn", !!prefs.anims);

  setNewenkirk.classList.toggle("on", !!prefs.newenkirk);
  setSounds.classList.toggle("on", !!prefs.sounds);
  setAnims.classList.toggle("on", !!prefs.anims);

  applySpeedToAudio();
}

/* ===== SW update ===== */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.ready.then((reg) => {
    reg.update().catch(() => {});
  }).catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    location.reload();
  });
}

const menuView = document.getElementById("menuView");
const playlistView = document.getElementById("playlistView");
const playlistDetailView = document.getElementById("playlistDetailView");
const playerView = document.getElementById("playerView");
const settingsView = document.getElementById("settingsView");

const navMenu = document.getElementById("navMenu");
const navPlaylist = document.getElementById("navPlaylist");
const navPlayer = document.getElementById("navPlayer");
const navSettings = document.getElementById("navSettings");

const addBtn = document.getElementById("addBtn");
const filePick = document.getElementById("filePick");

const tracksList = document.getElementById("tracksList");
const tracksEmpty = document.getElementById("tracksEmpty");
const countPill = document.getElementById("countPill");
const nowPill = document.getElementById("nowPill");

const createPlBtn = document.getElementById("createPlBtn");
const playlistsList = document.getElementById("playlistsList");

const plBackBtn = document.getElementById("plBackBtn");
const plTitlePill = document.getElementById("plTitlePill");
const plAddBtn = document.getElementById("plAddBtn");
const playlistTracksList = document.getElementById("playlistTracksList");
const playlistTracksEmpty = document.getElementById("playlistTracksEmpty");

const plPopup = document.getElementById("plPopup");
const plNameInput = document.getElementById("plNameInput");
const plCancelBtn = document.getElementById("plCancelBtn");
const plCreateBtn = document.getElementById("plCreateBtn");

const libPicker = document.getElementById("libPicker");
const libPickerList = document.getElementById("libPickerList");
const libPickerEmpty = document.getElementById("libPickerEmpty");
const libCancelBtn = document.getElementById("libCancelBtn");
const libAddBtn = document.getElementById("libAddBtn");

const toast = document.getElementById("toast");

const ctxMenu = document.getElementById("ctxMenu");
const ctxDelete = document.getElementById("ctxDelete");
const ctxRename = document.getElementById("ctxRename");

const delConfirm = document.getElementById("delConfirm");
const delText = document.getElementById("delText");
const delCancel = document.getElementById("delCancel");
const delOk = document.getElementById("delOk");

const renamePopup = document.getElementById("renamePopup");
const renameInput = document.getElementById("renameInput");
const renameCancelBtn = document.getElementById("renameCancelBtn");
const renameSaveBtn = document.getElementById("renameSaveBtn");

const audio = document.getElementById("audio");
const playPause = document.getElementById("playPause");
const stopBtn = document.getElementById("stopBtn");
const timePill = document.getElementById("timePill");
const seek = document.getElementById("seek");

const overlay = document.getElementById("overlay");
const closeMenu = document.getElementById("closeMenu");
const menuTrack = document.getElementById("menuTrack");
const menuCover = document.getElementById("menuCover");
const menuTimePill = document.getElementById("menuTimePill");
const menuSeek = document.getElementById("menuSeek");

const loopBtn = document.getElementById("loopBtn");
const back10Btn = document.getElementById("back10");
const fwd10Btn = document.getElementById("fwd10");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const menuPlayPause = document.getElementById("menuPlayPause");

/* Speed UI (":" button + overlay panel) */
const speedBtn = document.getElementById("speedBtn");
const speedOverlay = document.getElementById("speedOverlay");
const speedCloseBtn = document.getElementById("speedCloseBtn");
const speedRange = document.getElementById("speedRange");
const speedValuePill = document.getElementById("speedValuePill");
const speedResetBtn = document.getElementById("speedResetBtn");

const playerNowPill = document.getElementById("playerNowPill");
const playerHint = document.getElementById("playerHint");
const playerCover = document.getElementById("playerCover");
const playerSeek = document.getElementById("playerSeek");
const playerTimePill = document.getElementById("playerTimePill");
const playerLoopBtn = document.getElementById("playerLoopBtn");
const playerBack10 = document.getElementById("playerBack10");
const playerPrevBtn = document.getElementById("playerPrevBtn");
const playerPlayPause = document.getElementById("playerPlayPause");
const playerNextBtn = document.getElementById("playerNextBtn");
const playerFwd10 = document.getElementById("playerFwd10");

/* Player speed ":" button */
const playerSpeedBtn = document.getElementById("playerSpeedBtn");

/* Settings buttons */
const setNewenkirk = document.getElementById("setNewenkirk");
const setSounds = document.getElementById("setSounds");
const setAnims = document.getElementById("setAnims");

/* ===== Sound FX (WebAudio) ===== */
let sfxCtx = null;
let sfxLoading = { click:false, select:false };
let sfxBuf = { click:null, select:null };

function isMusicPlaying(){
  return !!audio.src && !audio.paused && !audio.ended;
}

function getCtx(){
  if (!sfxCtx) sfxCtx = new (window.AudioContext || window.webkitAudioContext)();
  return sfxCtx;
}

async function ensureSfxLoaded(kind){
  if (!prefs.sounds) return;
  if (sfxBuf[kind] || sfxLoading[kind]) return;

  sfxLoading[kind] = true;
  try {
    const ctx = getCtx();
    const url = (kind === "click") ? "./Click.wav" : "./Select.wav";
    const res = await fetch(url, { cache: "no-store" });
    const arr = await res.arrayBuffer();
    sfxBuf[kind] = await ctx.decodeAudioData(arr.slice(0));
  } catch {
    sfxBuf[kind] = null;
  } finally {
    sfxLoading[kind] = false;
  }
}

async function playSfx(kind){
  if (!prefs.sounds) return;
  if (isMusicPlaying()) return;

  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") await ctx.resume().catch(() => {});
    await ensureSfxLoaded(kind);
    const buf = sfxBuf[kind];
    if (!buf) return;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch {}
}

async function playClick(){ await playSfx("click"); }
async function playSelect(){ await playSfx("select"); }

let db = null;

let tracks = [];
let playlists = [];

let currentId = null;
let currentUrl = null;
let menuForId = null;

let currentTab = "menu";
let currentPlaylistId = null;

let seekingMain = false;
let seekingMenu = false;
let seekingPlayer = false;

let pickerSelected = new Set();

let ctxForId = null;
let deleteTargetId = null;
let renameTargetId = null;

/* Safari freeze fix state */
let playIntent = false;
let stallTimer = null;
let stallLastTime = 0;
let stallLastPerf = 0;
let stallRecovering = false;
let currentTrackObj = null;

function uid(){
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now();
}

function openDB(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains(STORE_TRACKS)) d.createObjectStore(STORE_TRACKS, { keyPath: "id" });
      if (!d.objectStoreNames.contains(STORE_PLAYLISTS)) d.createObjectStore(STORE_PLAYLISTS, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function store(name, mode){
  return db.transaction(name, mode).objectStore(name);
}

function putTrack(obj){
  return new Promise((resolve, reject) => {
    const r = store(STORE_TRACKS, "readwrite").put(obj);
    r.onsuccess = () => resolve(true);
    r.onerror = () => reject(r.error);
  });
}

function deleteTrack(id){
  return new Promise((resolve, reject) => {
    const r = store(STORE_TRACKS, "readwrite").delete(id);
    r.onsuccess = () => resolve(true);
    r.onerror = () => reject(r.error);
  });
}

function getAllTracks(){
  return new Promise((resolve, reject) => {
    const r = store(STORE_TRACKS, "readonly").getAll();
    r.onsuccess = () => resolve(r.result || []);
    r.onerror = () => reject(r.error);
  });
}

function putPlaylist(obj){
  return new Promise((resolve, reject) => {
    const r = store(STORE_PLAYLISTS, "readwrite").put(obj);
    r.onsuccess = () => resolve(true);
    r.onerror = () => reject(r.error);
  });
}

function getAllPlaylists(){
  return new Promise((resolve, reject) => {
    const r = store(STORE_PLAYLISTS, "readonly").getAll();
    r.onsuccess = () => resolve(r.result || []);
    r.onerror = () => reject(r.error);
  });
}

function getPlaylist(id){
  return playlists.find(p => p.id === id) || null;
}

function showOnly(which){
  const views = [menuView, playlistView, playerView, settingsView];
  for (const v of views) v.classList.remove("show");
  which.classList.add("show");
}

function setActiveNav(tab){
  navMenu.classList.toggle("active", tab === "menu");
  navPlaylist.classList.toggle("active", tab === "playlist");
  navPlayer.classList.toggle("active", tab === "player");
  navSettings.classList.toggle("active", tab === "settings");
}

function goMenu(){
  currentTab = "menu";
  currentPlaylistId = null;
  setActiveNav("menu");
  showOnly(menuView);
  renderTracks();
}

function goPlaylistList(){
  currentTab = "playlist";
  currentPlaylistId = null;
  setActiveNav("playlist");
  showOnly(playlistView);
  renderPlaylists();
}

/* ===== Slide panel helpers (Animations toggle) ===== */
function openPanel(panelEl){
  panelEl.hidden = false;

  if (!prefs.anims){
    panelEl.classList.remove("animStart", "animIn", "animOut");
    return;
  }

  panelEl.classList.remove("animOut");
  panelEl.classList.add("animStart");
  panelEl.getBoundingClientRect();
  panelEl.classList.add("animIn");
  panelEl.classList.remove("animStart");
}

function closePanel(panelEl){
  if (panelEl.hidden) return;

  if (!prefs.anims){
    panelEl.hidden = true;
    panelEl.classList.remove("animStart", "animIn", "animOut");
    return;
  }

  panelEl.classList.remove("animIn");
  panelEl.classList.add("animOut");
  const done = () => {
    panelEl.hidden = true;
    panelEl.classList.remove("animOut");
    panelEl.removeEventListener("transitionend", done);
  };
  panelEl.addEventListener("transitionend", done);
}

function goPlaylistDetail(id){
  currentTab = "playlist";
  currentPlaylistId = id;
  setActiveNav("playlist");
  showOnly(playlistView);

  const p = getPlaylist(id);
  plTitlePill.textContent = p ? p.name : "Playlist";

  renderPlaylistTracks();
  openPanel(playlistDetailView);
}

function backFromPlaylistDetail(){
  closePanel(playlistDetailView);
}

function goPlayer(){
  currentTab = "player";
  currentPlaylistId = null;
  setActiveNav("player");
  showOnly(playerView);
  updatePlayerUI();
  updateTime();
  syncButtons();
}

function goSettings(){
  currentTab = "settings";
  currentPlaylistId = null;
  setActiveNav("settings");
  showOnly(settingsView);
}

function isPlaying(){
  return !!audio.src && !audio.paused && !audio.ended;
}

function syncButtons(){
  const sym = isPlaying() ? "❚❚" : "▶";
  playPause.textContent = sym;
  menuPlayPause.textContent = sym;
  playerPlayPause.textContent = sym;
}

function setLoopUIFor(el, on){
  if (!el) return;
  if (on) el.classList.add("loopActive");
  else el.classList.remove("loopActive");
}

/* ===== Speed ===== */
function clampSpeed(v){
  const n = Number(v);
  if (!isFinite(n)) return 1;
  return Math.max(0.4, Math.min(2, n));
}

function fmtSpeed(v){
  const n = clampSpeed(v);
  let s = n.toFixed(2);
  s = s.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  return s + "x";
}

function setPreservesPitch(mediaEl, preserve){
  try { if ("preservesPitch" in mediaEl) mediaEl.preservesPitch = preserve; } catch {}
  try { if ("mozPreservesPitch" in mediaEl) mediaEl.mozPreservesPitch = preserve; } catch {}
  try { if ("webkitPreservesPitch" in mediaEl) mediaEl.webkitPreservesPitch = preserve; } catch {}
}

function updateSpeedUI(){
  const r = clampSpeed(prefs.speed);

  if (speedValuePill) speedValuePill.textContent = fmtSpeed(r);
  if (speedRange) speedRange.value = String(r);

  const active = Math.abs(r - 1) > 0.001;
  setLoopUIFor(speedBtn, active);
  setLoopUIFor(playerSpeedBtn, active);
}

function applySpeedToAudio(){
  const r = clampSpeed(prefs.speed);
  prefs.speed = r;

  try { setPreservesPitch(audio, false); } catch {}
  try { audio.playbackRate = r; } catch {}

  updateSpeedUI();
}

/* Speed overlay animation (same style as overlay menu) */
function openSpeedAnimated(){
  if (!speedOverlay) return;
  speedOverlay.hidden = false;

  if (!prefs.anims){
    speedOverlay.classList.remove("animStart", "animOut");
    speedOverlay.classList.add("animIn");
    return;
  }

  speedOverlay.classList.remove("animOut");
  speedOverlay.classList.add("animStart");
  speedOverlay.getBoundingClientRect();
  speedOverlay.classList.add("animIn");
  speedOverlay.classList.remove("animStart");
}

function closeSpeedAnimated(){
  if (!speedOverlay || speedOverlay.hidden) return;

  if (!prefs.anims){
    speedOverlay.hidden = true;
    speedOverlay.classList.remove("animIn", "animStart", "animOut");
    return;
  }

  speedOverlay.classList.remove("animIn");
  speedOverlay.classList.add("animOut");

  const done = () => {
    speedOverlay.hidden = true;
    speedOverlay.classList.remove("animOut");
    speedOverlay.removeEventListener("transitionend", done);
  };
  speedOverlay.addEventListener("transitionend", done);
}

function openSpeedPanel(){
  updateSpeedUI();
  openSpeedAnimated();
}

function closeSpeedPanel(){
  closeSpeedAnimated();
}

function fmtTime(s){
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return m + ":" + String(r).padStart(2, "0");
}

/* Filled = 0000CC, Track = 0000AA */
function setRangeFill(el, v){
  if (!el) return;
  const clamped = Math.max(0, Math.min(1000, Number(v) || 0));
  const pct = (clamped / 1000) * 100;
  el.style.background = `linear-gradient(to right, #0000CC 0%, #0000CC ${pct}%, #0000AA ${pct}%, #0000AA 100%)`;
}

function updateTime(){
  const cur = audio.currentTime || 0;
  const dur = audio.duration || 0;
  const text = fmtTime(cur) + " / " + fmtTime(dur);

  timePill.textContent = text;
  menuTimePill.textContent = text;
  playerTimePill.textContent = text;

  const v = dur > 0 ? Math.floor((cur / dur) * 1000) : 0;

  if (!seekingMain) seek.value = String(v);
  if (!seekingMenu) menuSeek.value = String(v);
  if (!seekingPlayer) playerSeek.value = String(v);

  setRangeFill(seek, seek.value);
  setRangeFill(menuSeek, menuSeek.value);
  setRangeFill(playerSeek, playerSeek.value);
}

function updateNowPill(){
  const current = tracks.find(x => x.id === currentId);
  const name = current ? current.name : "—";
  nowPill.textContent = "Now: " + name;
  playerNowPill.textContent = name;
}

function updateCountPill(){
  countPill.textContent = tracks.length + (tracks.length === 1 ? " track" : " tracks");
}

function updateMenuCover(id){
  const t = tracks.find(x => x.id === id);
  menuCover.src = (t && t.cover) ? t.cover : "BluePlayer.png";
}

function updatePlayerUI(){
  const t = tracks.find(x => x.id === currentId);
  if (!t){
    playerHint.hidden = true;
    playerCover.src = "BluePlayer.png";
    setLoopUIFor(playerLoopBtn, false);
    updateNowPill();
    updateSpeedUI();
    return;
  }
  playerHint.hidden = true;
  playerCover.src = t.cover || "BluePlayer.png";
  setLoopUIFor(playerLoopBtn, !!t.loop);
  updateNowPill();
  updateSpeedUI();
}

/* ===== Safari freeze recovery ===== */
function startStallWatch(){
  if (stallTimer) return;

  stallLastTime = audio.currentTime || 0;
  stallLastPerf = performance.now();

  stallTimer = setInterval(() => {
    if (!playIntent) {
      stallLastTime = audio.currentTime || 0;
      stallLastPerf = performance.now();
      return;
    }
    if (!audio.src || audio.paused || audio.ended) return;

    const ct = audio.currentTime || 0;
    if (ct > stallLastTime + 0.01) {
      stallLastTime = ct;
      stallLastPerf = performance.now();
      return;
    }

    const elapsed = performance.now() - stallLastPerf;
    if (elapsed < 1200) return;

    recoverFromStall().catch(() => {});
  }, 350);
}

async function recoverFromStall(){
  if (stallRecovering) return;
  stallRecovering = true;

  try {
    if (!audio.src) return;

    const before = audio.currentTime || 0;

    try { await audio.play(); } catch {}
    await new Promise(r => setTimeout(r, 140));

    const mid = audio.currentTime || 0;
    if (mid > before + 0.01) {
      stallLastTime = mid;
      stallLastPerf = performance.now();
      return;
    }

    try {
      const dur = audio.duration || 0;
      const bump = before + 0.05;
      if (dur > 0) audio.currentTime = Math.min(dur, bump);
      else audio.currentTime = bump;
    } catch {}

    try { await audio.play(); } catch {}
    await new Promise(r => setTimeout(r, 160));

    const afterNudge = audio.currentTime || 0;
    if (afterNudge > before + 0.01) {
      stallLastTime = afterNudge;
      stallLastPerf = performance.now();
      return;
    }

    if (currentTrackObj && currentTrackObj.blob) {
      const keep = before;

      if (currentUrl) {
        try { URL.revokeObjectURL(currentUrl); } catch {}
        currentUrl = null;
      }

      const blob = currentTrackObj.blob;
      const type = currentTrackObj.type || blob.type || "audio/mpeg";
      const sliced = blob.slice(0, blob.size, type);

      currentUrl = URL.createObjectURL(sliced);

      try { audio.pause(); } catch {}
      try {
        audio.removeAttribute("src");
        audio.load();
      } catch {}

      audio.src = currentUrl;
      audio.preload = "auto";
      audio.muted = false;
      audio.volume = 1;

      applySpeedToAudio();

      try { audio.load(); } catch {}

      await new Promise((resolve) => {
        let done = false;
        const fin = () => { if (!done){ done = true; resolve(); } };
        audio.addEventListener("loadedmetadata", fin, { once:true });
        audio.addEventListener("canplay", fin, { once:true });
        setTimeout(fin, 250);
      });

      try {
        const dur = audio.duration || 0;
        if (dur > 0) audio.currentTime = Math.min(dur, keep);
        else audio.currentTime = keep;
      } catch {}

      try { await audio.play(); } catch {}
      await new Promise(r => setTimeout(r, 160));
    }

    stallLastTime = audio.currentTime || 0;
    stallLastPerf = performance.now();
  } finally {
    stallRecovering = false;
  }
}

async function reliablePlay(){
  playIntent = true;
  startStallWatch();

  try {
    await audio.play();
  } catch {
    await new Promise((resolve) => {
      let done = false;
      const fin = () => { if (!done){ done = true; resolve(); } };
      audio.addEventListener("canplay", fin, { once:true });
      audio.addEventListener("loadeddata", fin, { once:true });
      setTimeout(fin, 300);
    });
    try { await audio.play(); } catch {}
  }

  setTimeout(() => {
    if (!audio.src) return;
    if (playIntent && audio.paused) audio.play().catch(() => {});
  }, 220);
}

/* ===== Playback ===== */
async function playTrack(id){
  const t = tracks.find(x => x.id === id);
  if (!t) return;

  currentTrackObj = t;
  currentId = id;

  playIntent = true;
  startStallWatch();

  try { audio.pause(); } catch {}
  try { audio.currentTime = 0; } catch {}

  if (currentUrl){
    try { URL.revokeObjectURL(currentUrl); } catch {}
    currentUrl = null;
  }

  const safeType = t.type || (t.blob && t.blob.type) || "audio/mpeg";
  const safeBlob = t.blob ? t.blob.slice(0, t.blob.size, safeType) : null;

  currentUrl = URL.createObjectURL(safeBlob || t.blob);

  try {
    audio.removeAttribute("src");
    audio.load();
  } catch {}

  audio.src = currentUrl;
  audio.preload = "auto";
  audio.muted = false;
  audio.volume = 1;

  applySpeedToAudio();

  try { audio.load(); } catch {}

  audio.loop = !!t.loop;
  setLoopUIFor(loopBtn, audio.loop);
  setLoopUIFor(playerLoopBtn, audio.loop);

  await reliablePlay();

  syncButtons();
  updateNowPill();
  updatePlayerUI();
  renderTracks();
  renderPlaylistTracks();
  updateTime();

  stallLastTime = audio.currentTime || 0;
  stallLastPerf = performance.now();
}

/* ===== Inside menu animation (overlay) ===== */
function openMenuAnimated(){
  overlay.hidden = false;

  if (!prefs.anims){
    overlay.classList.remove("animStart", "animOut");
    overlay.classList.add("animIn");
    return;
  }

  overlay.classList.remove("animOut");
  overlay.classList.add("animStart");
  overlay.getBoundingClientRect();
  overlay.classList.add("animIn");
  overlay.classList.remove("animStart");
}

function closeMenuAnimated(){
  if (overlay.hidden) return;

  if (!prefs.anims){
    overlay.hidden = true;
    overlay.classList.remove("animIn", "animStart", "animOut");
    return;
  }

  overlay.classList.remove("animIn");
  overlay.classList.add("animOut");

  const done = () => {
    overlay.hidden = true;
    overlay.classList.remove("animOut");
    overlay.removeEventListener("transitionend", done);
  };
  overlay.addEventListener("transitionend", done);
}

function openMenu(id){
  menuForId = id;
  const t = tracks.find(x => x.id === id);
  menuTrack.textContent = t ? (t.name || "Unknown") : "Menu";

  setLoopUIFor(loopBtn, !!(t && t.loop));
  if (t && currentId === id) audio.loop = !!t.loop;

  updateMenuCover(id);
  syncButtons();
  updateTime();
  updateSpeedUI();
  openMenuAnimated();
}

function closeMenuNow(){
  closeMenuAnimated();
  menuForId = null;
}

async function setTrackLoop(id, loop){
  const i = tracks.findIndex(x => x.id === id);
  if (i < 0) return;
  tracks[i].loop = !!loop;
  await putTrack(tracks[i]);
}

function currentIndex(){
  if (!currentId) return -1;
  return tracks.findIndex(t => t.id === currentId);
}

async function playByIndex(i){
  if (!tracks.length) return;
  let idx = i;
  if (idx < 0) idx = tracks.length - 1;
  if (idx >= tracks.length) idx = 0;
  await playTrack(tracks[idx].id);
  updateMenuCover(currentId);
  updatePlayerUI();
}

function skipSeconds(delta){
  if (!audio.src) return;
  const dur = audio.duration || 0;
  const next = (audio.currentTime || 0) + delta;
  if (dur > 0) audio.currentTime = Math.max(0, Math.min(dur, next));
  else audio.currentTime = Math.max(0, next);
  updateTime();
}

/* ===== Context Menu ===== */
function closeCtx(){
  ctxMenu.hidden = true;
  ctxForId = null;
}

function openCtxFor(id, anchorEl){
  ctxForId = id;

  const r = anchorEl.getBoundingClientRect();
  const menuW = 180;
  const menuH = 2 * 48 + 4;

  let left = Math.round(r.right - menuW);
  let top = Math.round(r.bottom + 6);

  left = Math.max(8, Math.min(left, window.innerWidth - menuW - 8));
  top = Math.max(8, Math.min(top, window.innerHeight - menuH - 8));

  ctxMenu.style.left = left + "px";
  ctxMenu.style.top = top + "px";
  ctxMenu.hidden = false;
}

/* ===== Delete confirm ===== */
function openDeleteConfirm(id){
  deleteTargetId = id;
  const t = tracks.find(x => x.id === id);
  const name = t ? (t.name || "Unknown") : "Unknown";
  delText.textContent = "Confirm deletion: " + name;
  delConfirm.hidden = false;
}

function closeDeleteConfirm(){
  delConfirm.hidden = true;
  deleteTargetId = null;
}

async function deleteTrackEverywhere(id){
  const idx = tracks.findIndex(t => t.id === id);
  if (idx < 0) return;

  const wasCurrent = (currentId === id);

  await deleteTrack(id);
  tracks.splice(idx, 1);

  for (const p of playlists){
    if (Array.isArray(p.trackIds) && p.trackIds.includes(id)){
      p.trackIds = p.trackIds.filter(x => x !== id);
      await putPlaylist(p);
    }
  }

  if (wasCurrent){
    playIntent = false;
    try { audio.pause(); } catch {}
    try { audio.currentTime = 0; } catch {}
    audio.src = "";
    if (currentUrl){
      try { URL.revokeObjectURL(currentUrl); } catch {}
      currentUrl = null;
    }
    currentId = null;
    currentTrackObj = null;
    syncButtons();
  }

  renderTracks();
  renderPlaylists();
  renderPlaylistTracks();
  updateNowPill();
  updatePlayerUI();
  updateTime();
}

/* ===== Rename ===== */
function openRename(id){
  renameTargetId = id;
  const t = tracks.find(x => x.id === id);
  renameInput.value = t ? (t.name || "") : "";
  renamePopup.hidden = false;
  setTimeout(() => renameInput.focus(), 0);
}

function closeRename(){
  renamePopup.hidden = true;
  renameTargetId = null;
}

async function saveRename(){
  if (!renameTargetId) return;
  const t = tracks.find(x => x.id === renameTargetId);
  if (!t) return;

  const next = (renameInput.value || "").trim();
  if (!next) return;

  t.name = next;
  await putTrack(t);

  renderTracks();
  renderPlaylistTracks();
  updateNowPill();

  if (!overlay.hidden && menuForId === renameTargetId){
    menuTrack.textContent = next;
  }
  closeRename();
}

/* ===== Lists ===== */
function buildTrackRow(t){
  const row = document.createElement("div");
  row.className = "track" + (t.id === currentId ? " active" : "");
  row.dataset.id = t.id;

  const name = document.createElement("div");
  name.className = "name";
  name.textContent = t.name || "Unknown";

  const opts = document.createElement("button");
  opts.className = "miniBtn";
  opts.textContent = "⋮";
  opts.addEventListener("click", (e) => {
    e.stopPropagation();
    openCtxFor(t.id, opts);
  });

  row.appendChild(name);
  row.appendChild(opts);

  row.addEventListener("click", () => playTrack(t.id));
  row.addEventListener("dblclick", () => openMenu(t.id));

  return row;
}

function renderTracks(){
  tracksList.innerHTML = "";
  if (!tracks.length){
    tracksList.appendChild(tracksEmpty);
  } else {
    for (const t of tracks) tracksList.appendChild(buildTrackRow(t));
  }
  updateCountPill();
  updateNowPill();
}

function buildPlaylistRow(p){
  const row = document.createElement("div");
  row.className = "track" + (p.id === currentPlaylistId ? " active" : "");

  const name = document.createElement("div");
  name.className = "name";
  name.textContent = p.name || "Playlist";

  row.appendChild(name);

  row.addEventListener("click", () => goPlaylistDetail(p.id));
  row.addEventListener("dblclick", () => goPlaylistDetail(p.id));

  return row;
}

function renderPlaylists(){
  playlistsList.innerHTML = "";
  if (!playlists.length){
    return;
  }
  const sorted = [...playlists].sort((a,b) => (a.createdAt||0) - (b.createdAt||0));
  for (const p of sorted) playlistsList.appendChild(buildPlaylistRow(p));
}

function renderPlaylistTracks(){
  playlistTracksList.innerHTML = "";
  const p = getPlaylist(currentPlaylistId);
  const ids = (p && Array.isArray(p.trackIds)) ? p.trackIds : [];
  const items = ids.map(id => tracks.find(t => t.id === id)).filter(Boolean);

  if (!items.length){
    playlistTracksList.appendChild(playlistTracksEmpty);
  } else {
    for (const t of items) playlistTracksList.appendChild(buildTrackRow(t));
  }
}

/* ===== Library Picker ===== */
function buildPickRow(t){
  const row = document.createElement("div");
  row.className = "pickRow";
  row.dataset.id = t.id;

  const name = document.createElement("div");
  name.className = "name";
  name.textContent = t.name || "Unknown";

  row.appendChild(name);

  const refresh = () => row.classList.toggle("selected", pickerSelected.has(t.id));

  row.addEventListener("click", () => {
    if (pickerSelected.has(t.id)) pickerSelected.delete(t.id);
    else pickerSelected.add(t.id);
    refresh();
  });

  refresh();
  return row;
}

function renderLibraryPicker(){
  libPickerList.innerHTML = "";
  if (!tracks.length){
    libPickerList.appendChild(libPickerEmpty);
    return;
  }
  for (const t of tracks) libPickerList.appendChild(buildPickRow(t));
}

function openLibraryPicker(){
  pickerSelected = new Set();
  renderLibraryPicker();
  libPicker.hidden = false;
}

function closeLibraryPicker(){
  libPicker.hidden = true;
  pickerSelected = new Set();
}

function showErrorToast(){
  toast.hidden = false;
  toast.style.opacity = "1";

  const startFade = () => {
    const dur = 400;
    const t0 = performance.now();

    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      toast.style.opacity = String(1 - p);
      if (p < 1) requestAnimationFrame(step);
      else {
        toast.hidden = true;
        toast.style.opacity = "1";
      }
    };

    requestAnimationFrame(step);
  };

  setTimeout(startFade, 1000);
}

async function addSelectedToCurrentPlaylist(){
  const p = getPlaylist(currentPlaylistId);
  if (!p) return;

  const ids = Array.from(pickerSelected);
  if (!ids.length){
    showErrorToast();
    return;
  }

  if (!Array.isArray(p.trackIds)) p.trackIds = [];
  const existing = new Set(p.trackIds);

  for (const id of ids){
    if (!existing.has(id)){
      p.trackIds.push(id);
      existing.add(id);
    }
  }

  await putPlaylist(p);
  renderPlaylistTracks();
  closeLibraryPicker();
}

/* ===== Covers from MP4 ===== */
async function coverFromVideoBlob(blob){
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const v = document.createElement("video");
    v.src = url;
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";

    const cleanup = () => URL.revokeObjectURL(url);

    v.addEventListener("error", () => {
      cleanup();
      resolve(null);
    });

    v.addEventListener("loadeddata", () => {
      try {
        const target = Math.min(0.15, Math.max(0, (v.duration || 0) * 0.01));
        v.currentTime = target;
      } catch {
        cleanup();
        resolve(null);
      }
    });

    v.addEventListener("seeked", () => {
      try {
        const w = v.videoWidth || 0;
        const h = v.videoHeight || 0;
        if (!w || !h) {
          cleanup();
          resolve(null);
          return;
        }

        const size = Math.min(w, h);
        const sx = Math.floor((w - size) / 2);
        const sy = Math.floor((h - size) / 2);

        const c = document.createElement("canvas");
        c.width = size;
        c.height = size;

        const ctx = c.getContext("2d");
        ctx.drawImage(v, sx, sy, size, size, 0, 0, size, size);

        const dataUrl = c.toDataURL("image/png");
        cleanup();
        resolve(dataUrl);
      } catch {
        cleanup();
        resolve(null);
      }
    });
  });
}

async function maybeExtractCover(file, blob){
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (type === "video/mp4" || name.endsWith(".mp4") || type === "audio/mp4") {
    const cover = await coverFromVideoBlob(blob);
    return cover || null;
  }
  return null;
}

async function addFilesToLibrary(files){
  for (const f of files){
    const buf = await f.arrayBuffer();
    const blob = new Blob([buf], { type: f.type || "audio/mpeg" });

    const cover = await maybeExtractCover(f, blob);
    const id = uid();

    const obj = { id, name: f.name, type: f.type || "audio/mpeg", addedAt: Date.now(), loop:false, cover: cover || null, blob };
    await putTrack(obj);
    tracks.push(obj);
  }

  tracks.sort((a,b) => (a.addedAt || 0) - (b.addedAt || 0));
  renderTracks();
}

/* ===== Playlist create popup ===== */
function showCreatePlaylistPopup(){
  plPopup.hidden = false;
  plNameInput.value = "";
  setTimeout(() => plNameInput.focus(), 0);
}

function hideCreatePlaylistPopup(){
  plPopup.hidden = true;
}

async function createPlaylistFromInput(){
  const name = (plNameInput.value || "").trim();
  if (!name) return;

  const obj = { id: uid(), name, createdAt: Date.now(), trackIds: [] };
  await putPlaylist(obj);
  playlists.push(obj);
  playlists.sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0));

  hideCreatePlaylistPopup();
  renderPlaylists();
}

/* ===== SETTINGS handlers (play Select.wav ONLY when enabling) ===== */
async function toggleNewenkirk(){
  const next = !prefs.newenkirk;
  prefs.newenkirk = next;
  savePrefs();
  applyPrefs();
  if (next) await playSelect();
}

async function toggleSounds(){
  const next = !prefs.sounds;
  prefs.sounds = next;
  savePrefs();
  applyPrefs();

  if (next) {
    await playSelect();
    ensureSfxLoaded("click").catch(() => {});
    ensureSfxLoaded("select").catch(() => {});
  } else {
    sfxBuf.click = null;
    sfxBuf.select = null;
  }
}

async function toggleAnims(){
  const next = !prefs.anims;
  prefs.anims = next;
  savePrefs();
  applyPrefs();
  if (next) await playSelect();
}

/* ===== Events ===== */
navMenu.addEventListener("click", async () => {
  await playClick();
  goMenu();
});
navPlaylist.addEventListener("click", async () => {
  await playClick();
  if (currentPlaylistId) goPlaylistDetail(currentPlaylistId);
  else goPlaylistList();
});
navPlayer.addEventListener("click", async () => {
  await playClick();
  goPlayer();
});
navSettings.addEventListener("click", async () => {
  await playClick();
  goSettings();
});

setNewenkirk.addEventListener("click", () => { toggleNewenkirk().catch(() => {}); });
setSounds.addEventListener("click", () => { toggleSounds().catch(() => {}); });
setAnims.addEventListener("click", () => { toggleAnims().catch(() => {}); });

addBtn.addEventListener("click", () => filePick.click());
filePick.addEventListener("change", async () => {
  const files = Array.from(filePick.files || []);
  filePick.value = "";
  if (!files.length) return;
  await addFilesToLibrary(files);
});

createPlBtn.addEventListener("click", showCreatePlaylistPopup);
plCancelBtn.addEventListener("click", hideCreatePlaylistPopup);
plCreateBtn.addEventListener("click", createPlaylistFromInput);
plNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") createPlaylistFromInput();
  if (e.key === "Escape") hideCreatePlaylistPopup();
});

plBackBtn.addEventListener("click", backFromPlaylistDetail);
plAddBtn.addEventListener("click", () => {
  if (!currentPlaylistId) return;
  openLibraryPicker();
});

libCancelBtn.addEventListener("click", closeLibraryPicker);
libAddBtn.addEventListener("click", addSelectedToCurrentPlaylist);
libPicker.addEventListener("click", (e) => {
  if (e.target === libPicker) closeLibraryPicker();
});

ctxDelete.addEventListener("click", () => {
  if (!ctxForId) return;
  const id = ctxForId;
  closeCtx();
  openDeleteConfirm(id);
});

ctxRename.addEventListener("click", () => {
  if (!ctxForId) return;
  const id = ctxForId;
  closeCtx();
  openRename(id);
});

document.addEventListener("click", (e) => {
  if (!ctxMenu.hidden){
    if (!ctxMenu.contains(e.target)) closeCtx();
  }
});

delCancel.addEventListener("click", closeDeleteConfirm);
delConfirm.addEventListener("click", (e) => {
  if (e.target === delConfirm) closeDeleteConfirm();
});
delOk.addEventListener("click", async () => {
  if (!deleteTargetId) return;
  const id = deleteTargetId;
  closeDeleteConfirm();
  await deleteTrackEverywhere(id);
});

renameCancelBtn.addEventListener("click", closeRename);
renamePopup.addEventListener("click", (e) => {
  if (e.target === renamePopup) closeRename();
});
renameSaveBtn.addEventListener("click", saveRename);
renameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveRename();
  if (e.key === "Escape") closeRename();
});

/* Speed ":" button (Menu overlay + Player tab) */
if (speedBtn) speedBtn.addEventListener("click", async () => {
  await playClick();
  openSpeedPanel();
});
if (playerSpeedBtn) playerSpeedBtn.addEventListener("click", async () => {
  await playClick();
  openSpeedPanel();
});
if (speedCloseBtn) speedCloseBtn.addEventListener("click", closeSpeedPanel);
if (speedOverlay) {
  speedOverlay.addEventListener("click", (e) => {
    if (e.target === speedOverlay) closeSpeedPanel();
  });
}
if (speedResetBtn) speedResetBtn.addEventListener("click", () => {
  prefs.speed = 1;
  savePrefs();
  applySpeedToAudio();
});
if (speedRange) {
  const onChange = () => {
    prefs.speed = clampSpeed(speedRange.value);
    savePrefs();
    applySpeedToAudio();
  };
  speedRange.addEventListener("input", onChange);
  speedRange.addEventListener("change", onChange);
}

menuPlayPause.addEventListener("click", async () => {
  playIntent = true;
  startStallWatch();

  if (!audio.src){
    if (menuForId) await playTrack(menuForId);
    else if (tracks.length) await playTrack(tracks[0].id);
    return;
  }
  if (audio.paused) await reliablePlay();
  else {
    playIntent = false;
    audio.pause();
  }
  syncButtons();
});
closeMenu.addEventListener("click", closeMenuNow);

loopBtn.addEventListener("click", async () => {
  if (!menuForId) return;
  const t = tracks.find(x => x.id === menuForId);
  if (!t) return;

  const next = !t.loop;
  await setTrackLoop(menuForId, next);

  if (currentId === menuForId) audio.loop = next;
  setLoopUIFor(loopBtn, next);
  setLoopUIFor(playerLoopBtn, next);
});

back10Btn.addEventListener("click", () => skipSeconds(-10));
fwd10Btn.addEventListener("click", () => skipSeconds(10));

prevBtn.addEventListener("click", async () => {
  if (!tracks.length) return;
  if (!currentId){
    if (menuForId) await playTrack(menuForId);
    else await playTrack(tracks[0].id);
    return;
  }
  const idx = currentIndex();
  await playByIndex(idx - 1);
});

nextBtn.addEventListener("click", async () => {
  if (!tracks.length) return;
  if (!currentId){
    if (menuForId) await playTrack(menuForId);
    else await playTrack(tracks[0].id);
    return;
  }
  const idx = currentIndex();
  await playByIndex(idx + 1);
});

menuSeek.addEventListener("input", () => {
  seekingMenu = true;
  setRangeFill(menuSeek, menuSeek.value);
});
menuSeek.addEventListener("change", () => {
  const dur = audio.duration || 0;
  const pct = Number(menuSeek.value) / 1000;
  if (dur > 0) audio.currentTime = dur * pct;
  seekingMenu = false;
  updateTime();
});

playerPlayPause.addEventListener("click", async () => {
  playIntent = true;
  startStallWatch();

  if (!audio.src){
    if (currentId) await playTrack(currentId);
    else if (tracks.length) await playTrack(tracks[0].id);
    return;
  }
  if (audio.paused) await reliablePlay();
  else {
    playIntent = false;
    audio.pause();
  }
  syncButtons();
});

playerLoopBtn.addEventListener("click", async () => {
  if (!currentId) return;
  const t = tracks.find(x => x.id === currentId);
  if (!t) return;

  const next = !t.loop;
  await setTrackLoop(currentId, next);
  audio.loop = next;

  setLoopUIFor(playerLoopBtn, next);
  setLoopUIFor(loopBtn, next);
});

playerBack10.addEventListener("click", () => skipSeconds(-10));
playerFwd10.addEventListener("click", () => skipSeconds(10));

playerPrevBtn.addEventListener("click", async () => {
  if (!tracks.length) return;
  if (!currentId){
    await playTrack(tracks[0].id);
    return;
  }
  const idx = currentIndex();
  await playByIndex(idx - 1);
});

playerNextBtn.addEventListener("click", async () => {
  if (!tracks.length) return;
  if (!currentId){
    await playTrack(tracks[0].id);
    return;
  }
  const idx = currentIndex();
  await playByIndex(idx + 1);
});

playerSeek.addEventListener("input", () => {
  seekingPlayer = true;
  setRangeFill(playerSeek, playerSeek.value);
});
playerSeek.addEventListener("change", () => {
  const dur = audio.duration || 0;
  const pct = Number(playerSeek.value) / 1000;
  if (dur > 0) audio.currentTime = dur * pct;
  seekingPlayer = false;
  updateTime();
});

playPause.addEventListener("click", async () => {
  playIntent = true;
  startStallWatch();

  if (!audio.src){
    if (tracks.length) await playTrack(tracks[0].id);
    return;
  }
  if (audio.paused) await reliablePlay();
  else {
    playIntent = false;
    audio.pause();
  }
  syncButtons();
});

stopBtn.addEventListener("click", () => {
  playIntent = false;
  audio.pause();
  audio.currentTime = 0;
  syncButtons();
  updateTime();
});

seek.addEventListener("input", () => {
  seekingMain = true;
  setRangeFill(seek, seek.value);
});
seek.addEventListener("change", () => {
  const dur = audio.duration || 0;
  const pct = Number(seek.value) / 1000;
  if (dur > 0) audio.currentTime = dur * pct;
  seekingMain = false;
  updateTime();
});

audio.addEventListener("timeupdate", updateTime);
audio.addEventListener("loadedmetadata", updateTime);

audio.addEventListener("playing", () => {
  playIntent = true;
  startStallWatch();
  stallLastTime = audio.currentTime || 0;
  stallLastPerf = performance.now();
  syncButtons();
  updateTime();
});

audio.addEventListener("pause", () => {
  if (!audio.ended) playIntent = false;
  syncButtons();
  updateTime();
});

audio.addEventListener("ended", () => {
  playIntent = false;
  syncButtons();
  updateTime();
});

audio.addEventListener("stalled", () => recoverFromStall().catch(() => {}));
audio.addEventListener("waiting", () => recoverFromStall().catch(() => {}));

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && playIntent && audio.src) {
    reliablePlay().catch(() => {});
  }
});

/* ===== Boot ===== */
(async () => {
  loadPrefs();
  applyPrefs();

  overlay.hidden = true;
  overlay.classList.remove("animStart", "animIn", "animOut");

  if (speedOverlay){
    speedOverlay.hidden = true;
    speedOverlay.classList.remove("animStart", "animIn", "animOut");
  }

  playlistDetailView.hidden = true;
  playlistDetailView.classList.remove("animStart", "animIn", "animOut");

  plPopup.hidden = true;
  libPicker.hidden = true;
  toast.hidden = true;

  ctxMenu.hidden = true;
  delConfirm.hidden = true;
  renamePopup.hidden = true;

  db = await openDB();

  tracks = await getAllTracks();
  tracks.sort((a,b) => (a.addedAt || 0) - (b.addedAt || 0));

  playlists = await getAllPlaylists();
  playlists.sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0));

  renderTracks();
  renderPlaylists();
  updateNowPill();
  updatePlayerUI();
  updateTime();
  syncButtons();

  goMenu();

  if (prefs.sounds) {
    ensureSfxLoaded("click").catch(() => {});
    ensureSfxLoaded("select").catch(() => {});
  }
})();
