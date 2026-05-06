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
const credits = document.querySelectorAll(".credit");
const archLabel = document.getElementById("arch-label");
// const video = document.getElementById("sean-video");
const timestamps = [0, 3, 6, 9, 12, 15, 18, 21];

credits.forEach(item => {
  item.addEventListener("mouseenter", () => {
    credits.forEach(c => c.classList.remove("active"));
    item.classList.add("active");
    archLabel.textContent = item.querySelector(".cname").textContent;
    // if (video) video.currentTime = timestamps[parseInt(item.dataset.index)];
  });
});
