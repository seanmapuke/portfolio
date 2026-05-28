/* ════════════════════════════════════════════
   SEAN — main.js
════════════════════════════════════════════ */

/* ── Custom cursor ──────────────────────── */
const cursor = document.getElementById('cursor');
if (cursor) {
  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const inLight = under?.closest('.s-projects, .s-contact, .page-content, nav');
    cursor.classList.toggle('on-light', !!inLight);
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
const loader    = document.getElementById('loader');
const loaderBar = document.getElementById('loader-bar');
const roomImg   = document.getElementById('room-img');

if (loader && loaderBar) {
  setTimeout(() => { loaderBar.style.width = '100%'; }, 80);
  const dismissLoader = () => setTimeout(() => {
    loader.classList.add('done');
    if (roomImg) roomImg.classList.add('loaded');
  }, 1300);

  if (roomImg) {
    roomImg.addEventListener('load', dismissLoader);
    if (roomImg.complete) dismissLoader();
  } else {
    setTimeout(dismissLoader, 600);
  }
}

/* ── Dot positioning ────────────────────────
   Dots sit inside .room-img-wrap.
   data-x / data-y are % of the IMAGE dimensions.
   We convert to px so they stay locked regardless
   of screen size or scroll position.
──────────────────────────────────────────── */
function positionDots() {
  const wrap = document.querySelector('.room-img-wrap');
  const img  = document.getElementById('room-img');
  if (!wrap || !img) return;

  const w = img.offsetWidth;
  const h = img.offsetHeight;

  document.querySelectorAll('.dot-wrap').forEach(dot => {
    const x = parseFloat(dot.dataset.x);
    const y = parseFloat(dot.dataset.y);
    dot.style.left = (w * x / 100) + 'px';
    dot.style.top  = (h * y / 100) + 'px';
  });
}

/* Run on load and every resize */
window.addEventListener('resize', positionDots);
if (roomImg) {
  roomImg.addEventListener('load', positionDots);
  if (roomImg.complete) positionDots();
} else {
  positionDots();
}

/* ── Dot clicks ─────────────────────────── */
const spotifyPanel = document.getElementById('spotify-panel');
const spClose      = document.getElementById('sp-close');

document.querySelectorAll('.dot-wrap').forEach(dot => {
  dot.addEventListener('click', () => {
    if (dot.dataset.type === 'spotify') { toggleSpotify(); return; }
    const href = dot.dataset.href;
    if (href) {
      dot.dataset.external === 'true'
        ? window.open(href, '_blank')
        : window.location.href = href;
    }
  });
});

if (spClose) {
  spClose.addEventListener('click', () => {
    spotifyPanel.classList.remove('visible');
    spotifyOpen = false;
  });
}

/* ── Spotify ────────────────────────────────
   SETUP:
   1. Go to https://developer.spotify.com/dashboard
   2. Create an app, add your domain as a Redirect URI
   3. Get a refresh token with scope:
        user-read-currently-playing user-read-playback-state
   4. Set DEMO_MODE = false and fill in the three constants
   5. For production: proxy the token refresh through a
      Vercel/Netlify serverless function so CLIENT_SECRET
      never ships in this file.

   CALIBRATION TIP:
   To find exact dot coordinates, open the site in your browser
   and run this in the console — then click each object:

     const img = document.getElementById('room-img');
     img.addEventListener('click', e => {
       const r = img.getBoundingClientRect();
       const x = ((e.clientX - r.left) / r.width  * 100).toFixed(2);
       const y = ((e.clientY - r.top)  / r.height * 100).toFixed(2);
       console.log(`data-x="${x}" data-y="${y}"`);
     });

   Then update the data-x / data-y on each .dot-wrap in index.html.
──────────────────────────────────────────── */
const DEMO_MODE     = true;
const CLIENT_ID     = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REFRESH_TOKEN = 'YOUR_REFRESH_TOKEN';

let spotifyOpen = false;

async function toggleSpotify() {
  if (!spotifyPanel) return;
  if (spotifyOpen) {
    spotifyPanel.classList.remove('visible');
    spotifyOpen = false;
    return;
  }
  spotifyPanel.classList.add('visible');
  spotifyOpen = true;
  await fetchNowPlaying();
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

async function fetchNowPlaying() {
  const content = document.getElementById('sp-content');
  if (!content) return;

  if (DEMO_MODE) {
    renderTrack({ name: 'Add Spotify credentials', artist: 'See setup notes in main.js', art: null, playing: true });
    return;
  }

  content.innerHTML = `<div class="sp-idle">Loading…</div>`;
  try {
    const token = await getAccessToken();
    const res   = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 204 || res.status === 404) {
      content.innerHTML = `<div class="sp-idle">Nothing playing right now.</div>`; return;
    }
    const data = await res.json();
    if (!data?.item) { content.innerHTML = `<div class="sp-idle">Nothing playing right now.</div>`; return; }
    renderTrack({
      name:    data.item.name,
      artist:  data.item.artists.map(a => a.name).join(', '),
      art:     data.item.album.images[1]?.url || data.item.album.images[0]?.url,
      playing: data.is_playing
    });
  } catch {
    content.innerHTML = `<div class="sp-idle">Couldn't connect. Check credentials in main.js.</div>`;
  }
}

function renderTrack({ name, artist, art, playing }) {
  const content = document.getElementById('sp-content');
  if (!content) return;
  const artEl  = art
    ? `<img class="sp-art" src="${art}" alt="album art">`
    : `<div class="sp-art"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(245,237,228,0.3)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="22"/></svg></div>`;
  const barsEl = playing
    ? `<div class="sp-bars"><div class="sp-bar"></div><div class="sp-bar"></div><div class="sp-bar"></div><div class="sp-bar"></div><div class="sp-bar"></div></div>`
    : '';
  content.innerHTML = `<div class="sp-track">${artEl}<div class="sp-info"><div class="sp-song">${name}</div><div class="sp-artist">${artist}</div>${barsEl}</div></div>`;
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
