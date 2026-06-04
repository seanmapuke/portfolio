/* ════════════════════════════════════════════
   SEAN — main.js
════════════════════════════════════════════ */

/* ── Custom cursor ──────────────────────── */
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
const roomImg = document.getElementById('room-img');

if (loader) {
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

/* ── Day / Night (dot) ──────────────────── */
const NIGHT_SRC = 'Untitled.png';
const DAY_SRC   = 'Untitled2.png';
let   isDay     = localStorage.getItem('colorMode') === 'day';

function applyMode(day, animate) {
  const labelEl = document.getElementById('daynight-label');
  if (labelEl) labelEl.textContent = day ? 'Switch to Night' : 'Switch to Day';

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
      localStorage.setItem('colorMode', isDay ? 'day' : 'night');
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
  });
}

/* ── Spotify ────────────────────────────── */
const DEMO_MODE     = false;
const CLIENT_ID     = '4e66114e764044b4a42eae803d34c038';
const CLIENT_SECRET = '038568c332a8407db12386838fb84702';
const REFRESH_TOKEN = 'AQCCHdrU1fEsgROuu2I7m2GRzOT_WjZ63kDX4uwMR9liEmuOpjk7HtdGvw8vToK6jq0PnrXQgsOvGHrMtBis8UHb91pOTdeH8xfTCpCAwip_q2psWWRFntZX1bwey6q4Ohk';

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
    : `<div class="sp-art"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg></div>`;
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
