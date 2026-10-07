/* ════════════════════════════════════════════
   SEAN — main.js
════════════════════════════════════════════ */

/* ── Dynamic dot repositioning ──────────── */
// Image is height:100vh, width:auto — no object-fit cropping.
// Dots are placed as % of the image's natural rendered dimensions.

const roomImg = document.getElementById('room-img');

function repositionDotsFromOriginal() {
  if (!roomImg || !roomImg.offsetWidth) return;

  const IMG_RATIO = 2880 / 1800; // 16:10
  const vpRatio   = window.innerWidth / window.innerHeight;
  const isCover   = vpRatio > IMG_RATIO; // matches the @media (min-aspect-ratio: 8/5)

  let imgW, imgH, offsetX, offsetY;

  if (isCover) {
    // object-fit: cover — image fills viewport, center-center cropped
    if (vpRatio > IMG_RATIO) {
      imgW = window.innerWidth;
      imgH = window.innerWidth / IMG_RATIO;
    } else {
      imgH = window.innerHeight;
      imgW = window.innerHeight * IMG_RATIO;
    }
    offsetX = (window.innerWidth  - imgW) / 2;
    offsetY = (window.innerHeight - imgH) / 2;
  } else {
    // horizontal scroll — image is height:100vh, width:auto, no crop
    imgW    = roomImg.offsetWidth;
    imgH    = roomImg.offsetHeight;
    offsetX = 0;
    offsetY = 0;
  }

  document.querySelectorAll('.dot-wrap').forEach(dot => {
    const pctLeft = parseFloat(dot.dataset.origLeft) / 100;
    const pctTop  = parseFloat(dot.dataset.origTop)  / 100;

    dot.style.left = (offsetX + pctLeft * imgW) + 'px';
    dot.style.top  = (offsetY + pctTop  * imgH) + 'px';
  });
}

// Store original percentages once before any repositioning
document.querySelectorAll('.dot-wrap').forEach(dot => {
  dot.dataset.origLeft = dot.style.left;
  dot.dataset.origTop  = dot.style.top;
  // Clear inline % so px values take over
  dot.style.left = '';
  dot.style.top  = '';
});

window.addEventListener('resize', repositionDotsFromOriginal);
window.addEventListener('load',   repositionDotsFromOriginal);



const cursor = document.getElementById('cursor');
if (cursor) {
  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
    // Flip cursor white when hovering over the room image (dark photo)
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const onRoom = under?.closest('.s-room');
    cursor.classList.toggle('on-dark', !!onRoom);
  });
  document.addEventListener('mouseleave', () => cursor.style.opacity = '0');
  document.addEventListener('mouseenter', () => cursor.style.opacity = '1');

  document.querySelectorAll('.dot-wrap, .contact-row, .credit, .project-card, .contact-value, .nav-links a, .nav-logo, #sp-close, a')
    .forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
    });
}

/* ── Loader ─────────────────────────────── */
const loader  = document.getElementById('loader');

if (loader) {
  const dismissLoader = () => setTimeout(() => {
    loader.classList.add('done');
    if (roomImg) {
      roomImg.classList.add('loaded');
      repositionDotsFromOriginal();
    }
  }, 1300);

  if (roomImg) {
    roomImg.addEventListener('load', dismissLoader);
    if (roomImg.complete) dismissLoader();
  } else {
    setTimeout(dismissLoader, 600);
  }
}

/* ── Day / Night (dot) ──────────────────── */
const NIGHT_SRC = 'room/nighttime.webp';
const DAY_SRC   = 'room/daytime.webp';
// Use time-of-day as default if user hasn't manually toggled
const _saved = sessionStorage.getItem('colorMode');
const _hour  = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', hour12: false });
const _isDayTime = parseInt(_hour) >= 6 && parseInt(_hour) < 20; // 6am–8pm CDT = day
let   isDay  = _saved !== null ? _saved === 'day' : _isDayTime;

function applyMode(day, animate) {
  const labelEl = document.getElementById('daynight-label');
  if (labelEl) labelEl.textContent = day ? 'Switch to Night' : 'Switch to Day';
  document.body.classList.toggle('day-mode', day);

  if (!roomImg) return;
  if (animate) {
    roomImg.style.transition = 'opacity 0.4s ease';
    roomImg.style.opacity = '0';
    setTimeout(() => {
      roomImg.src = day ? DAY_SRC : NIGHT_SRC;
      roomImg.onload = () => { roomImg.style.opacity = '1'; };
      if (roomImg.complete) roomImg.style.opacity = '1';
    }, 380);
  } else {
    roomImg.src = day ? DAY_SRC : NIGHT_SRC;
  }
}

// Restore on load
if (isDay) applyMode(true, false);

/* ── Dot clicks ─────────────────────────── */
const spotifyPanel = document.getElementById('spotify-panel');
const spClose      = document.getElementById('sp-close');

document.querySelectorAll('.dot-wrap').forEach(dot => {
  dot.addEventListener('click', (e) => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (isMobile && !dot.classList.contains('tapped')) {
      document.querySelectorAll('.dot-wrap').forEach(d => d.classList.remove('tapped'));
      dot.classList.add('tapped');
      return;
    }

    dot.classList.remove('tapped');

    if (dot.dataset.type === 'spotify')  { toggleSpotify(); return; }
    if (dot.dataset.type === 'daynight') {
      isDay = !isDay;
      sessionStorage.setItem('colorMode', isDay ? 'day' : 'night');
      applyMode(isDay, true);
      return;
    }

    const href = dot.dataset.href;
    if (href) {
      dot.dataset.external === 'true'
        ? window.open(href, '_blank')
        : window.location.href = href;
    }
  });
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.dot-wrap')) {
    document.querySelectorAll('.dot-wrap').forEach(d => d.classList.remove('tapped'));
  }
});

if (spClose) {
  spClose.addEventListener('click', () => {
    spotifyPanel.classList.remove('visible');
    spotifyOpen = false;
    startPolling();
  });
}

/* ── Spotify ────────────────────────────── */
const DEMO_MODE     = false;
const CLIENT_ID     = '4e66114e764044b4a42eae803d34c038';
const CLIENT_SECRET = '038568c332a8407db12386838fb84702';
const REFRESH_TOKEN = 'AQCCHdrU1fEsgROuu2I7m2GRzOT_WjZ63kDX4uwMR9liEmuOpjk7HtdGvw8vToK6jq0PnrXQgsOvGHrMtBis8UHb91pOTdeH8xfTCpCAwip_q2psWWRFntZX1bwey6q4Ohk';

let spotifyOpen = false;
let spotifyPollInterval = null;
let currentTrackId = null;
let hasLoadedOnce  = false;

// Cache the access token instead of re-fetching it on every open —
// this alone removes a full network round trip from the critical path.
let cachedToken  = null;
let tokenExpiry  = 0;

async function toggleSpotify() {
  if (!spotifyPanel) return;
  if (spotifyOpen) {
    spotifyPanel.classList.remove('visible');
    spotifyOpen = false;
    startPolling();
    return;
  }
  spotifyPanel.classList.add('visible');
  spotifyOpen = true;
  startPolling();

  // The background poll usually has data already; show the skeleton only if not.
  if (!hasLoadedOnce) setSpContent(skeletonHTML());
  await fetchNowPlaying(true);
}

// Fast while the panel is open, slow while closed (the token is shared by every visitor).
const POLL_OPEN_MS   = 1500;
const POLL_CLOSED_MS = 15000;
let fetchInFlight = false;

function startPolling() {
  clearInterval(spotifyPollInterval);
  if (document.hidden) { spotifyPollInterval = null; return; }
  spotifyPollInterval = setInterval(() => fetchNowPlaying(true), spotifyOpen ? POLL_OPEN_MS : POLL_CLOSED_MS);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { clearInterval(spotifyPollInterval); spotifyPollInterval = null; return; }
  fetchNowPlaying(true);
  startPolling();
});

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) return cachedToken;

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
    },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(REFRESH_TOKEN)}`
  });
  const data = await res.json();
  cachedToken = data.access_token;
  // Refresh a minute early so we never hand out a token that's about to expire
  tokenExpiry = now + ((data.expires_in || 3600) - 60) * 1000;
  return cachedToken;
}

function setSpContent(html) {
  const content = document.getElementById('sp-content');
  if (!content) return;
  // Wrap in a fade-in shell so every swap (skeleton → player, track → track)
  // eases in at a fixed height instead of popping/jumping.
  content.innerHTML = `<div class="sp-fade-in">${html}</div>`;
  requestAnimationFrame(() => cycleTruncated(content));
}

// Song titles that don't fit scroll continuously, like a ticker: the text
// is doubled with a gap so the loop is seamless. Titles that fit stay put.
const MARQUEE_SEL = '.sp-song, .sp-pl-song';
const MARQUEE_PX_PER_S = 28;
const MARQUEE_GAP = 32;
function cycleTruncated(root) {
  root.querySelectorAll(MARQUEE_SEL).forEach(el => {
    if (el.dataset.text === undefined) el.dataset.text = el.textContent;
    const text = el.dataset.text;
    el.classList.remove('sp-cycling');
    el.textContent = text;
    const pad = parseFloat(getComputedStyle(el).paddingRight) || 0;
    if (el.scrollWidth - pad <= el.clientWidth - pad + 1) return;
    el.innerHTML = '';
    const track = document.createElement('span');
    track.className = 'sp-mq';
    for (let i = 0; i < 2; i++) {
      const copy = document.createElement('span');
      copy.textContent = text;
      if (i) copy.setAttribute('aria-hidden', 'true');
      track.appendChild(copy);
    }
    el.appendChild(track);
    // The strip moves by exactly half its width (one copy + gap), so the
    // seam is exact no matter how the text is measured or rounded.
    const loop = track.getBoundingClientRect().width / 2;
    el.style.setProperty('--sp-pad', `${pad}px`);
    el.style.setProperty('--sp-gap', `${MARQUEE_GAP}px`);
    el.style.setProperty('--sp-dur', `${(loop / MARQUEE_PX_PER_S).toFixed(2)}s`);
    el.classList.add('sp-cycling');
  });
}
// Re-measure once web fonts finish loading so the overflow check and speed
// use the real font, not the fallback.
if (document.fonts) {
  document.fonts.ready.then(() => {
    const content = document.getElementById('sp-content');
    if (content) cycleTruncated(content);
  });
}
let marqueeResize;
window.addEventListener('resize', () => {
  clearTimeout(marqueeResize);
  marqueeResize = setTimeout(() => {
    const content = document.getElementById('sp-content');
    if (content) cycleTruncated(content);
  }, 150);
});

function skeletonHTML() {
  return `
    <div class="sp-skeleton">
      <div class="sp-skeleton-art"></div>
      <div class="sp-skeleton-lines">
        <div class="sp-skeleton-line" style="width:70%"></div>
        <div class="sp-skeleton-line short"></div>
      </div>
    </div>`;
}

async function fetchNowPlaying(silent = false) {
  const content = document.getElementById('sp-content');
  if (!content || fetchInFlight) return;
  fetchInFlight = true;
  try { await fetchNowPlayingInner(silent); } finally { fetchInFlight = false; }
}

async function fetchNowPlayingInner(silent) {
  if (DEMO_MODE) {
    if (!hasLoadedOnce) {
      hasLoadedOnce  = true;
      currentTrackId = 'demo';
      renderTrack({ name: 'Add Spotify credentials', artist: 'See setup notes in main.js', art: null, playing: true });
    }
    return;
  }

  try {
    const token = await getAccessToken();
    const res   = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 204 || res.status === 404) {
      hasLoadedOnce = true;
      showIdle();
      return;
    }
    const data = await res.json();
    if (!data?.item) {
      hasLoadedOnce = true;
      showIdle();
      return;
    }

    // Only re-render if track or play state changed
    const newId = data.item.id + '_' + data.is_playing;
    hasLoadedOnce = true;
    if (newId === currentTrackId) return;
    currentTrackId = newId;

    renderTrack({
      name:    data.item.name,
      artist:  data.item.artists.map(a => a.name).join(', '),
      art:     data.item.album.images[1]?.url || data.item.album.images[0]?.url,
      playing: data.is_playing
    });
  } catch {
    if (!silent) setSpContent(`<div class="sp-idle">Couldn't connect. Check credentials in main.js.</div>`);
  }
}

/* ── Idle: show the playlist when nothing is playing ── */
const PLAYLIST_ID  = '39M6p4ekVA1uh1smT8lU7K';
const PLAYLIST_URL = 'https://open.spotify.com/playlist/39M6p4ekVA1uh1smT8lU7K?si=86a6dcfe42bb42a7';
const PLAYLIST_TTL_MS = 60000;
let playlistCache = null;
let playlistFetchedAt = 0;
let lastIdleHTML = '';

const esc = (t) => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmtDuration = (ms) => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

async function getPlaylist() {
  if (playlistCache && Date.now() - playlistFetchedAt < PLAYLIST_TTL_MS) return playlistCache;
  const token  = await getAccessToken();
  const fields = 'name,images,items.total,items.items(item(name,duration_ms,artists(name)))';
  const res = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}?fields=${encodeURIComponent(fields)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('playlist ' + res.status);
  const d = await res.json();
  playlistCache = {
    name:   d.name,
    cover:  d.images?.[1]?.url || d.images?.[0]?.url,
    total:  d.items.total,
    tracks: d.items.items.map(x => x.item).filter(Boolean).slice(0, 4).map(t => ({
      name:   t.name,
      artist: t.artists.map(a => a.name).join(', '),
      dur:    fmtDuration(t.duration_ms)
    }))
  };
  playlistFetchedAt = Date.now();
  return playlistCache;
}

async function showIdle() {
  const wasIdle = currentTrackId === 'idle';
  if (wasIdle && Date.now() - playlistFetchedAt < PLAYLIST_TTL_MS) return;
  currentTrackId = 'idle';
  const label = `<div class="sp-pl-label">NOT PLAYING ANYTHING RIGHT NOW.</div>`;
  const open  = `<a class="sp-pl-open" href="${PLAYLIST_URL}" target="_blank" rel="noopener">OPEN FULL PLAYLIST <svg class="sp-pl-arrow" viewBox="0 0 12 8" aria-hidden="true"><path d="M0 4h10.5M7.5 1l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1"/></svg></a>`;
  let pl;
  try { pl = await getPlaylist(); } catch {
    if (!wasIdle) setSpContent(`<div class="sp-pl">${label}${open}</div>`);
    return;
  }
  if (currentTrackId !== 'idle') return;
  const tracks = pl.tracks.map((t, i) => `
    <div class="sp-pl-track">
      <span class="sp-pl-num">${String(i + 1).padStart(2, '0')}</span>
      <div class="sp-pl-t"><span class="sp-pl-song">${esc(t.name)}</span><span class="sp-pl-artist">${esc(t.artist)}</span></div>
      <span class="sp-pl-dur">${t.dur}</span>
    </div>`).join('');
  const html = `
    <div class="sp-pl">
      ${label}
      <a class="sp-pl-head" href="${PLAYLIST_URL}" target="_blank" rel="noopener">
        <div class="sp-pl-art">${pl.cover ? `<img src="${esc(pl.cover)}" alt="" onload="this.classList.add('loaded')">` : ''}</div>
        <div class="sp-pl-info">
          <span class="sp-pl-name">${esc(pl.name)}</span>
          <span class="sp-pl-meta">${pl.total} tracks · updated weekly</span>
        </div>
      </a>
      <div class="sp-pl-rule"></div>
      <div class="sp-pl-tracks">${tracks}</div>
      ${open}
    </div>`;
  // Re-render only when switching into idle or when the playlist itself changed
  if (wasIdle && html === lastIdleHTML) return;
  lastIdleHTML = html;
  setSpContent(html);
}

// Prefetch on load so the panel opens with data already in place, then keep polling.
fetchNowPlaying(true);
startPolling();

/* Exact line data extracted from the Figma waveform SVG (8:112)
   Each entry: [x, y1, y2] — 42 lines, stroke-width 5, 10px spacing */
const WAVE_LINES = [
  [7.5,30.2281,75.7719],[17.5,17.4052,88.5948],[27.5,19.4274,86.5726],
  [37.5,38.9913,67.0087],[47.5,16.7345,89.2655],[57.5,34.7049,71.2951],
  [67.5,34.248,71.752],[77.5,35.6707,70.3293],[87.5,37.9361,68.0639],
  [97.5,31.6877,74.3123],[107.5,32.4929,73.5071],[117.5,19.0372,86.9628],
  [127.5,38.3301,67.6699],[137.5,14.8925,91.1075],[147.5,40.5467,65.4533],
  [157.5,44.2646,61.7354],[167.5,25.2482,80.7518],[177.5,21.0245,84.9755],
  [187.5,34.1876,71.8124],[197.5,38.3933,67.6068],[207.5,42.7112,63.2888],
  [217.5,36.4034,69.5966],[227.5,30.7875,75.2125],[237.5,37.8892,68.1108],
  [247.5,41.6409,64.3591],[257.5,37.0118,68.9882],[267.5,21.3969,84.6031],
  [277.5,28.1511,77.8489],[287.5,33.8057,72.1943],[297.5,33.5523,72.4477],
  [307.5,21.7331,84.2669],[317.5,44.4654,61.5346],[327.5,14.5108,91.4892],
  [337.5,44.1343,61.8657],[347.5,15.0059,90.9941],[357.5,40.5253,65.4747],
  [367.5,18.2977,87.7023],[377.5,21.9589,84.0411],[387.5,22.3941,83.6059],
  [397.5,34.8252,71.1748],[407.5,28.0581,77.9419],[417.5,39.4731,66.5269]
];

function buildWaveformSVG(playing) {
  const lines = WAVE_LINES.map(([x, y1, y2], i) => {
    const anim = playing
      ? ` style="transform-box:fill-box;transform-origin:center;animation:waveScale ${(0.38+(i%7)*0.06).toFixed(2)}s ${(i*0.018).toFixed(3)}s ease-in-out infinite alternate"`
      : '';
    return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="black" stroke-opacity="0.72" stroke-width="5" stroke-linecap="round"${anim}/>`;
  }).join('');
  return `<svg width="100%" height="100%" viewBox="-7 0 437 106" fill="none" preserveAspectRatio="xMinYMid meet" xmlns="http://www.w3.org/2000/svg">${lines}</svg>`;
}

function renderTrack({ name, artist, art, playing }) {
  // Fade the album art in only once it's actually decoded, instead of
  // popping in the instant the network request resolves.
  const artEl = art
    ? `<img src="${art}" alt="album art" onload="this.classList.add('loaded')">`
    : `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`;

  setSpContent(`
    <div class="sp-player">
      <div class="sp-art">${artEl}</div>
      <div class="sp-details">
        <div class="sp-song">${name}</div>
        <div class="sp-artist">${artist}</div>
        <div class="sp-waveform">${buildWaveformSVG(playing)}</div>
      </div>
    </div>`);
}

/* ── Projects hover ─────────────────────── */
const credits   = document.querySelectorAll('.credit');
const archLabel = document.getElementById('arch-label');
credits.forEach(item => {
  item.addEventListener('mouseenter', () => {
    credits.forEach(c => c.classList.remove('active'));
    item.classList.add('active');
    if (archLabel) archLabel.textContent = item.querySelector('.cname').textContent;
  });
});
