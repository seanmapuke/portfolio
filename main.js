/* ════════════════════════════════════════════
   SEAN — main.js
   Handles: cursor, loader, room dots, spotify,
            project hover, rotating hero title
════════════════════════════════════════════ */

/* ── Custom cursor ────────────────────────── */
const cursor = document.getElementById('cursor');
if (cursor) {
  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY  + 'px';
  });

  const hoverEls = () => document.querySelectorAll(
    '.dot-wrap, .contact-row, .credit, .project-card, .contact-value, .nav-links a, .nav-logo, #sp-close, a'
  );
  const attachCursorHover = () => {
    hoverEls().forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
    });
  };
  attachCursorHover();

  // Switch cursor dark when over light sections
  document.addEventListener('mousemove', e => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const inLight = el?.closest('.s-projects, .s-contact, .page-content, nav');
    cursor.classList.toggle('on-light', !!inLight);
  });
}

/* ── Loader ───────────────────────────────── */
const loader    = document.getElementById('loader');
const loaderBar = document.getElementById('loader-bar');
const roomImg   = document.getElementById('room-img');

if (loader && loaderBar) {
  setTimeout(() => { loaderBar.style.width = '100%'; }, 80);

  const dismissLoader = () => {
    setTimeout(() => {
      loader.classList.add('done');
      if (roomImg) roomImg.classList.add('loaded');
    }, 1300);
  };

  if (roomImg) {
    roomImg.addEventListener('load', dismissLoader);
    if (roomImg.complete) dismissLoader();
  } else {
    // non-room pages: dismiss after bar
    setTimeout(dismissLoader, 600);
  }
}

/* ── Room dot hotspots ────────────────────── */
const spotifyPanel = document.getElementById('spotify-panel');
const spClose      = document.getElementById('sp-close');

document.querySelectorAll('.dot-wrap').forEach(dot => {
  dot.addEventListener('click', () => {
    const type     = dot.dataset.type;
    const href     = dot.dataset.href;
    const external = dot.dataset.external === 'true';

    if (type === 'spotify') {
      toggleSpotify();
      return;
    }
    if (href) {
      if (external) window.open(href, '_blank');
      else window.location.href = href;
    }
  });
});

if (spClose) {
  spClose.addEventListener('click', () => {
    spotifyPanel.classList.remove('visible');
    spotifyOpen = false;
  });
}

/* ── Spotify ──────────────────────────────── */
// ─────────────────────────────────────────────────────
//  SETUP:
//  1. Create an app at https://developer.spotify.com/dashboard
//  2. Add your domain as a Redirect URI in the app settings
//  3. Get a refresh token with scope:
//       user-read-currently-playing user-read-playback-state
//  4. Fill in the three constants below
//  5. For production: proxy the token refresh through a
//     Vercel/Netlify serverless function so CLIENT_SECRET
//     stays server-side and isn't exposed in this file.
//
//  Set DEMO_MODE = false once credentials are ready.
// ─────────────────────────────────────────────────────
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
    renderTrack({
      name:    'Add Spotify credentials',
      artist:  'See setup notes in main.js',
      art:     null,
      playing: true
    });
    return;
  }

  content.innerHTML = `<div class="sp-idle">Loading…</div>`;

  try {
    const token = await getAccessToken();
    const res   = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 204 || res.status === 404) {
      content.innerHTML = `<div class="sp-idle">Nothing playing right now.</div>`;
      return;
    }

    const data = await res.json();
    if (!data?.item) {
      content.innerHTML = `<div class="sp-idle">Nothing playing right now.</div>`;
      return;
    }

    renderTrack({
      name:    data.item.name,
      artist:  data.item.artists.map(a => a.name).join(', '),
      art:     data.item.album.images[1]?.url || data.item.album.images[0]?.url,
      playing: data.is_playing
    });

  } catch {
    content.innerHTML = `<div class="sp-idle">Couldn't connect to Spotify.<br>Check your credentials in main.js.</div>`;
  }
}

function renderTrack({ name, artist, art, playing }) {
  const content = document.getElementById('sp-content');
  if (!content) return;

  const artEl = art
    ? `<img class="sp-art" src="${art}" alt="album art" />`
    : `<div class="sp-art">
         <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="rgba(245,237,228,0.3)" stroke-width="1.5">
           <circle cx="12" cy="12" r="10"/>
           <circle cx="12" cy="12" r="3"/>
           <line x1="12" y1="2" x2="12" y2="9"/>
           <line x1="12" y1="15" x2="12" y2="22"/>
         </svg>
       </div>`;

  const barsEl = playing
    ? `<div class="sp-bars">
         <div class="sp-bar"></div><div class="sp-bar"></div>
         <div class="sp-bar"></div><div class="sp-bar"></div>
         <div class="sp-bar"></div>
       </div>`
    : '';

  content.innerHTML = `
    <div class="sp-track">
      ${artEl}
      <div class="sp-info">
        <div class="sp-song">${name}</div>
        <div class="sp-artist">${artist}</div>
        ${barsEl}
      </div>
    </div>`;
}

/* ── Projects hover (index + projects page) ── */
const credits   = document.querySelectorAll('.credit');
const archLabel = document.getElementById('arch-label');

credits.forEach(item => {
  item.addEventListener('mouseenter', () => {
    credits.forEach(c => c.classList.remove('active'));
    item.classList.add('active');
    if (archLabel) archLabel.textContent = item.querySelector('.cname').textContent;
  });
});

/* ── Rotating hero title (legacy hero if kept) ── */
const titleEl = document.getElementById('title');
if (titleEl) {
  const titles = ['Sean', 'a designer', 'a developer', 'a creative', 'a human'];
  let tIdx = 0;
  setInterval(() => {
    titleEl.style.opacity   = '0';
    titleEl.style.transform = 'translateY(10px)';
    setTimeout(() => {
      tIdx = (tIdx + 1) % titles.length;
      titleEl.textContent     = titles[tIdx];
      titleEl.style.opacity   = '1';
      titleEl.style.transform = 'translateY(0)';
    }, 300);
  }, 1800);
}
