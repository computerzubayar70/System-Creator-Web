// SYSTEM CREATOR – interface enhancements (menu, reveal animations, counters, course search/filter, floating buttons)
document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Header shadow on scroll
  const header = $(".site-header");
  const onScroll = () => {
    header?.classList.toggle("is-scrolled", scrollY > 12);
    $(".fab-top")?.classList.toggle("is-visible", scrollY > 500);
  };

  // Mobile menu
  const nav = $(".main-nav");
  if (header && nav) {
    const btn = document.createElement("button");
    btn.className = "menu-toggle"; btn.type = "button"; btn.setAttribute("aria-label", "Open menu"); btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = "<span></span>";
    $(".header-inner").insertBefore(btn, $(".header-cta"));
    const setOpen = (open) => { nav.classList.toggle("is-open", open); btn.setAttribute("aria-expanded", open); btn.setAttribute("aria-label", open ? "Close menu" : "Open menu"); };
    btn.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }

  // Floating WhatsApp + back-to-top
  const fabs = document.createElement("div");
  fabs.className = "fab-stack";
  fabs.innerHTML = `<button class="fab fab-top" type="button" aria-label="Back to top">↑</button>
    <a class="fab fab-wa" href="https://wa.me/8801817155707" aria-label="Chat on WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 .9c.3.1.5.2.5.3.1.2.1.8-.1 1.4Z"/></svg></a>`;
  document.body.append(fabs);
  $(".fab-top").addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // Scroll-reveal
  const targets = $$(".service-card, .course-card, .stat-card, .how-step, .section-heading, .about-grid > *, .contact-card, .faq-list details, .founder-card");
  targets.forEach((el, i) => { el.classList.add("reveal"); el.style.setProperty("--d", `${(i % 6) * 70}ms`); });
  const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }), { threshold: 0.12 });
  targets.forEach((el) => io.observe(el));

  // Mouse spotlight on cards
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest?.(".service-card, .course-card, .contact-card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`); card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });

  // Animated counters
  const counters = $$("[data-count]");
  if (counters.length) {
    const co = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return; co.unobserve(en.target);
      const end = +en.target.dataset.count, suffix = en.target.dataset.suffix || "", t0 = performance.now();
      const tick = (t) => { const p = Math.min((t - t0) / 1200, 1); en.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix; if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }), { threshold: 0.4 });
    counters.forEach((c) => co.observe(c));
  }

  // Course search + category filter (courses page only)
  const sections = $$(".catalog-section");
  const cards = $$(".course-card");
  if (sections.length && cards.length) {
    const labels = { all: "All courses", adobe: "Adobe & Creative", coding: "Coding", marketing: "Digital Marketing" };
    const bar = document.createElement("div");
    bar.className = "catalog-toolbar";
    bar.innerHTML = `<div class="container"><div class="toolbar-inner">
      <label class="search-box"><span class="sr-only" style="position:absolute;left:-9999px">Search courses</span><input type="search" id="course-search" placeholder="Search ${cards.length} courses… (e.g. Python, video, SEO)" autocomplete="off"></label>
      <div class="chips" role="group" aria-label="Filter by category">${Object.entries(labels).map(([k, v]) => `<button type="button" class="chip${k === "all" ? " is-active" : ""}" data-cat="${k}">${v}</button>`).join("")}</div>
    </div><p class="result-count" id="result-count" aria-live="polite"></p></div>`;
    sections[0].before(bar);
    const empty = document.createElement("div");
    empty.className = "no-results container"; empty.innerHTML = "<h3>No courses match your search</h3><p>Try a different keyword, or message us on WhatsApp and we’ll help you find the right course.</p>";
    sections.at(-1).after(empty);

    // remember original text for highlighting
    cards.forEach((c) => { c._t = $("h3", c); c._p = $("p", c); c._t0 = c._t.textContent; c._p0 = c._p.textContent; });
    const esc = (s) => s.replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
    const mark = (text, q) => { if (!q) return esc(text); const i = text.toLowerCase().indexOf(q); return i < 0 ? esc(text) : esc(text.slice(0, i)) + '<mark class="hl">' + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length)); };

    let cat = location.hash.slice(1) in labels ? location.hash.slice(1) : "all";
    const input = $("#course-search");
    const apply = () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      sections.forEach((s) => {
        let n = 0;
        $$(".course-card", s).forEach((c) => {
          const hit = (cat === "all" || s.id === cat) && (!q || (c._t0 + " " + c._p0 + " " + $(".course-tag", c).textContent).toLowerCase().includes(q));
          c.classList.toggle("is-hidden", !hit);
          if (hit) { n++; c._t.innerHTML = mark(c._t0, q); c._p.innerHTML = mark(c._p0, q); c.classList.add("is-in"); }
        });
        s.classList.toggle("is-empty", n === 0); shown += n;
      });
      $("#result-count").textContent = `Showing ${shown} of ${cards.length} courses`;
      empty.classList.toggle("is-visible", shown === 0);
      $$(".chip", bar).forEach((b) => b.classList.toggle("is-active", b.dataset.cat === cat));
    };
    input.addEventListener("input", apply);
    bar.addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) { cat = b.dataset.cat; apply(); } });
    apply();
  }
});
