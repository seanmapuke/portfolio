// ── Scroll-reactive gradient
const gradientBg = document.getElementById("gradient-bg");

window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? window.scrollY / max : 0;
  const x = p * 100;
  const y = p * 100;
  gradientBg.style.backgroundPosition = `${x}% ${y}%`;
}, { passive: true });

// ── Rotating hero title
const titles = ["Sean", "a designer", "a developer", "a creative", "a human"];
let index = 0;
const el = document.getElementById("title");

setInterval(() => {
  el.style.opacity = 0;
  el.style.transform = "translateY(10px)";
  setTimeout(() => {
    index = (index + 1) % titles.length;
    el.textContent = titles[index];
    el.style.opacity = 1;
    el.style.transform = "translateY(0)";
  }, 300);
}, 1800);

// ── Project hover — updates label + triggers video look-around
const items = document.querySelectorAll(".proj-item");
const label = document.getElementById("arch-label");
// const video = document.getElementById("sean-video");

// Timestamps (seconds) for each project's video look direction
const videoTimestamps = [0, 3, 6, 9];

items.forEach(item => {
  item.addEventListener("mouseenter", () => {
    items.forEach(i => i.classList.remove("active"));
    item.classList.add("active");

    const idx = parseInt(item.dataset.index);
    label.textContent = item.querySelector(".ptitle").textContent;

    // Uncomment when video is ready:
    // if (video) video.currentTime = videoTimestamps[idx];
  });
});
