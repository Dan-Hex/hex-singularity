/* ── YEAR ── */
document.getElementById('year').textContent = new Date().getFullYear();

/* ── HAMBURGER ── */
function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}
function closeMenu() {
  document.getElementById('navLinks').classList.remove('open');
}

/* ── CAROUSEL STATE ── */
const carousels = {
  web: { index: 0, track: null, dots: null, total: 0 },
  gfx: { index: 0, track: null, dots: null, total: 0, perView: 3 }
};

function initCarousels() {
  /* Web carousel — 1 card at a time */
  const wt = document.getElementById('webTrack');
  const wCards = wt.querySelectorAll('.project-card-web');
  carousels.web.track = wt;
  carousels.web.total = wCards.length;
  carousels.web.dots = document.getElementById('webDots');
  buildDots('web');

  /* GFX carousel — Seamless Loop Setup */
  const gt = document.getElementById('gfxTrack');
  // Clean up any existing clones if this function runs twice
  gt.querySelectorAll('.clone').forEach(el => el.remove());

  const gCards = gt.querySelectorAll('.project-card-gfx:not(.clone)');
  carousels.gfx.track = gt;
  carousels.gfx.total = gCards.length; // The original 17 cards

  // Clone the first 3 items and append them to the end for the visual loop
  for(let i = 0; i < 3; i++) {
    if(gCards[i]) {
      let clone = gCards[i].cloneNode(true);
      clone.classList.add('clone');
      gt.appendChild(clone);
    }
  }

  carousels.gfx.dots = document.getElementById('gfxDots');
  buildDots('gfx');

  renderCarousel('web');
  renderCarousel('gfx');
}

function buildDots(id) {
  const c = carousels[id];
  c.dots.innerHTML = '';
  // Create exactly 1 dot per original item
  for (let i = 0; i < c.total; i++) {
    const d = document.createElement('button');
    d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    d.onclick = () => { 
      c.index = i; 
      renderCarousel(id); 
    };
    c.dots.appendChild(d);
  }
}

function getGfxPerView() {
  return window.innerWidth <= 600 ? 1 : window.innerWidth <= 900 ? 2 : 3;
}

function renderCarousel(id) {
  const c = carousels[id];

  if (id === 'web') {
    // --- WEB PROJECTS LOGIC ---
    const cards = c.track.querySelectorAll('.project-card-web');
    if (!cards.length) return;
    // Use actual card width + gap for precise offset (handles mobile correctly)
    const cardWidth = cards[0].offsetWidth;
    const offset = c.index * (cardWidth + 24);

    c.track.style.transition = 'transform 0.45s cubic-bezier(.4,0,.2,1)';
    c.track.style.transform = `translateX(-${offset}px)`;

    c.dots.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === c.index);
    });

  } else {
    // --- GFX SEAMLESS LOOP LOGIC ---
    const perView = getGfxPerView();
    const cards = c.track.querySelectorAll('.project-card-gfx');

    // Dynamically update card widths
    cards.forEach(el => {
      el.style.minWidth = `calc(${100/perView}% - ${(perView-1)*1.5/perView}rem)`;
      el.style.width = `calc(${100/perView}% - ${(perView-1)*1.5/perView}rem)`;
    });

    // Calculate exact slide distance (1 Card width + 24px CSS gap)
    const moveAmount = cards[0].offsetWidth + 24;

    // Handle Backwards Seamless Loop (Clicking the left arrow at the start)
    if (c.index < 0) {
       c.track.style.transition = 'none';
       c.index = c.total; // Instantly jump to the cloned set at the end
       c.track.style.transform = `translateX(-${c.index * moveAmount}px)`;
       c.track.offsetHeight; // Force the browser to register the jump
       c.index = c.total - 1; // Set up the smooth slide to the target card
    }

    // Apply the smooth slide
    c.track.style.transition = 'transform 0.45s cubic-bezier(.4,0,.2,1)';
    c.track.style.transform = `translateX(-${c.index * moveAmount}px)`;

    // Handle Forwards Seamless Loop (Auto-play hitting the end)
    if (c.index >= c.total) {
      setTimeout(() => {
        if (c.index >= c.total) { 
          c.track.style.transition = 'none';
          c.index = c.index - c.total; // Silently snap back to the true start
          c.track.style.transform = `translateX(-${c.index * moveAmount}px)`;
        }
      }, 450); // This waits exactly as long as the CSS transition takes
    }

    // Update dots (Mapping the clones back to the original dots)
    let activeDot = c.index % c.total;
    if (activeDot < 0) activeDot = c.total - 1;
    c.dots.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === activeDot);
    });
  }
}

function moveCarousel(id, dir) {
  const c = carousels[id];
  if (id === 'web') {
     // Web wraps around mathematically
     c.index = (c.index + dir + c.total) % c.total;
  } else {
     // GFX simply moves forward/backward; renderCarousel handles the boundaries
     c.index += dir; 
  }
  renderCarousel(id);
}

/* ── CATEGORY FILTER ── */
function switchCategory(cat, btn) {
  document.querySelectorAll('.category-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + cat).classList.add('active');
  btn.classList.add('active');
  renderCarousel(cat);
  
  // CRITICAL FIX: Restart the timer cleanly whenever you switch tabs
  startAutoPlay();
}

/* ── MULTI-IMAGE & SINGLE-IMAGE LIGHTBOX LOGIC ── */
function openProjectGallery(imageArray) {
  const gallery = document.getElementById('lightbox-gallery');
  gallery.innerHTML = ''; // Clear out the previous project's images

  // Force a 1-column layout for single images, otherwise use the 2-column grid
  if (imageArray.length === 1) {
    gallery.style.gridTemplateColumns = '1fr';
  } else {
    gallery.style.gridTemplateColumns = ''; 
  }

  // Loop through the provided array and create an img tag for each
  imageArray.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    gallery.appendChild(img);
  });

  document.getElementById('lightbox').classList.add('open');
}

// Prevent the lightbox from closing if the user clicks inside the content box
document.getElementById('lightbox-content').addEventListener('click', function(e) {
  e.stopPropagation();
});

/* ── AUTO CAROUSEL LOGIC ── */
let autoPlayTimer;

function startAutoPlay() {
  // CRITICAL FIX: Clear any existing timer before starting a new one to prevent glitching
  clearInterval(autoPlayTimer); 
  
  autoPlayTimer = setInterval(() => {
    // Check which category panel is currently active and move that specific carousel
    if (document.getElementById('panel-web').classList.contains('active')) {
      moveCarousel('web', 1);
    } else if (document.getElementById('panel-gfx').classList.contains('active')) {
      moveCarousel('gfx', 1);
    }
  }, 3500); // Moves every 3.5 seconds
}

function stopAutoPlay() {
  clearInterval(autoPlayTimer);
}

// Function to close the lightbox when clicking the background
function closeLightbox(event) {
  // We check the ID so it only closes if you click the dark background, 
  // NOT if you click the images inside the content box
  if (event.target.id === 'lightbox') {
    document.getElementById('lightbox').classList.remove('open');
  }
}

// Force the carousels to recalculate their exact widths if the screen size changes
window.addEventListener('resize', () => {
  renderCarousel('web');
  renderCarousel('gfx');
});

/* ── FADE-UP ON SCROLL ── */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// Attach hover listeners to ALL carousels to pause them when hovered
document.querySelectorAll('.carousel-wrap').forEach(wrap => {
  wrap.addEventListener('mouseenter', stopAutoPlay);
  wrap.addEventListener('mouseleave', startAutoPlay);
});

// Update your existing window load event to start the timer
window.addEventListener('load', () => {
  initCarousels();
  startAutoPlay(); 
});