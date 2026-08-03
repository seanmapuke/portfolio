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
const NIGHT_SRC = 'NIGHTTIME.webp';
const DAY_SRC   = 'DAYTIME.webp';
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
    clearInterval(spotifyPollInterval);
    spotifyPollInterval = null;
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

async function toggleSpotify() {
  if (!spotifyPanel) return;
  if (spotifyOpen) {
    spotifyPanel.classList.remove('visible');
    spotifyOpen = false;
    clearInterval(spotifyPollInterval);
    spotifyPollInterval = null;
    return;
  }
  spotifyPanel.classList.add('visible');
  spotifyOpen = true;
  await fetchNowPlaying();
  // Poll every 3s but only re-renders if track or play state actually changed
  spotifyPollInterval = setInterval(() => fetchNowPlaying(true), 3000);
}

async function getAccessToken() {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
    },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(REFRESH_TOKEN)}`
  });
  const data = await res.json();
  return data.access_token;
}

async function fetchNowPlaying(silent = false) {
  const content = document.getElementById('sp-content');
  if (!content) return;

  if (DEMO_MODE) {
    renderTrack({ name: 'Add Spotify credentials', artist: 'See setup notes in main.js', art: null, playing: true });
    return;
  }

  if (!silent) content.innerHTML = `<div class="sp-idle">Loading…</div>`;
  try {
    const token = await getAccessToken();
    const res   = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 204 || res.status === 404) {
      if (currentTrackId !== null) {
        currentTrackId = null;
        renderEmptyState();
      }
      return;
    }
    const data = await res.json();
    if (!data?.item) {
      if (currentTrackId !== null) {
        currentTrackId = null;
        renderEmptyState();
      }
      return;
    }

    // Only re-render if track or play state changed
    const newId = data.item.id + '_' + data.is_playing;
    if (newId === currentTrackId) return;
    currentTrackId = newId;

    renderTrack({
      name:    data.item.name,
      artist:  data.item.artists.map(a => a.name).join(', '),
      art:     data.item.album.images[1]?.url || data.item.album.images[0]?.url,
      playing: data.is_playing
    });
  } catch {
    if (!silent) content.innerHTML = `<div class="sp-idle">Couldn't connect. Check credentials in main.js.</div>`;
  }
}

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

const IDLE_JOKES = [
  { song: '4′ 33″', artist: 'John Cage', note: '(he’s not playing anything either)' },
  { song: 'Sound of Silence', artist: 'Absolutely Nobody', note: '(probably heads-down somewhere)' },
  { song: 'Dead Air', artist: 'Radio Static FM', note: '(the DJ stepped out for coffee)' },
  { song: 'Untitled Track', artist: 'Deafening Silence', note: '(check back after a snack break)' },
  { song: 'Loading...', artist: 'My Attention Span', note: '(buffering since 2019)' }
];

function renderEmptyState() {
  const content = document.getElementById('sp-content');
  if (!content) return;

  const pick = IDLE_JOKES[Math.floor(Math.random() * IDLE_JOKES.length)];

  content.innerHTML = `
    <div class="sp-player">
      <div class="sp-art sp-art-empty">💤</div>
      <div class="sp-details">
        <div class="sp-song">${pick.song}</div>
        <div class="sp-artist">${pick.artist}</div>
        <div class="sp-waveform">${buildWaveformSVG(false)}</div>
      </div>
    </div>
    <div class="sp-note">${pick.note}</div>`;
}

function renderTrack({ name, artist, art, playing }) {
  const content = document.getElementById('sp-content');
  if (!content) return;

  const artEl = art
    ? `<img src="${art}" alt="album art">`
    : `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`;

  content.innerHTML = `
    <div class="sp-player">
      <div class="sp-art">${artEl}</div>
      <div class="sp-details">
        <div class="sp-song">${name}</div>
        <div class="sp-artist">${artist}</div>
        <div class="sp-waveform">${buildWaveformSVG(playing)}</div>
      </div>
    </div>`;
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
