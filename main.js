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

// ── Project hover
const items = document.querySelectorAll(".credit");
const label = document.getElementById("arch-label");
// const video = document.getElementById("sean-video");
const videoTimestamps = [0, 3, 6, 9];

items.forEach(item => {
  item.addEventListener("mouseenter", () => {
    items.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    const idx = parseInt(item.dataset.index);
    label.textContent = item.querySelector(".credit-name").textContent;
    // if (video) video.currentTime = videoTimestamps[idx];
  });
});
