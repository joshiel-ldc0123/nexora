// Smooth scrolling for nav links
const links = document.querySelectorAll('.menu a');
links.forEach(a => a.addEventListener('click', e => {
  const target = document.querySelector(a.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.pushState(null, '', a.getAttribute('href'));
}));

// Highlight the nav link of the section currently in view
const spy = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('header[id], section[id]').forEach(s => spy.observe(s));

// Subtle parallax on the light streaks
const streaks = document.getElementById('streaks');
window.addEventListener('mousemove', e => {
  const x = (e.clientX / innerWidth - 0.5) * 18;
  const y = (e.clientY / innerHeight - 0.5) * 18;
  streaks.style.transform = `translate(${x}px, ${y}px)`;
});