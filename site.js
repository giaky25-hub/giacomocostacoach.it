/* Giacomo Costa, shared script for every page */
(function () {
  /* Every page opens at the top (back/forward keeps its own position) */
  var touched = false;
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) {
    window.addEventListener(ev, function () { touched = true; }, { passive: true, once: true });
  });
  function toTop() {
    if (touched || location.hash) return;
    var nav = window.performance && performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (nav && nav.type === 'back_forward') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }
  toTop();
  document.addEventListener('DOMContentLoaded', toTop);
  window.addEventListener('load', function () { toTop(); setTimeout(toTop, 120); setTimeout(toTop, 400); });
  window.addEventListener('pageshow', function (e) { if (!e.persisted) toTop(); });

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Hero name: one line, letter by letter */
  document.querySelectorAll('.nm').forEach(function (el) {
    var t = el.textContent;
    el.setAttribute('aria-label', t);
    el.textContent = '';
    Array.prototype.forEach.call(t, function (c, i) {
      var s = document.createElement('span');
      s.setAttribute('aria-hidden', 'true');
      if (c === ' ') { s.className = 'sp'; } else { s.className = 'ch'; s.textContent = c; s.style.setProperty('--i', i); }
      el.appendChild(s);
    });
  });

  /* Fit the hero name to the full width, whatever the font */
  function fitName() {
    document.querySelectorAll('.nm').forEach(function (el) {
      var chs = el.querySelectorAll('.ch,.sp');
      if (!chs.length) return;
      var last = chs[chs.length - 1];
      var prevAnim = el.style.animation;
      el.style.animation = 'none';
      el.style.fontSize = '100px';
      var w = last.offsetLeft + last.offsetWidth;
      var target = el.parentNode.clientWidth;
      if (w > 0 && target > 0) el.style.fontSize = Math.min(100 * target / w * .985, 148).toFixed(1) + 'px';
      el.style.animation = prevAnim;
    });
  }
  fitName();
  window.addEventListener('resize', fitName);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitName);
  window.addEventListener('load', fitName);

  /* Headlines: split into words for the rise-in effect */
  document.querySelectorAll('.h1,.h2,.big').forEach(function (h) {
    var i = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 1 && n.classList.contains('nm')) return;
        if (n.nodeType === 3) {
          var txt = n.nodeValue;
          var lead = /^\S+/.exec(txt), prev = n.previousSibling;
          if (lead && prev && prev.nodeType === 1) {
            var spans = prev.querySelectorAll('.w>span');
            if (spans.length) {
              spans[spans.length - 1].textContent += lead[0];
              txt = txt.slice(lead[0].length);
            }
          }
          var frag = document.createDocumentFragment();
          txt.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var s = document.createElement('span'); s.textContent = p; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) { walk(n); }
      });
    }
    walk(h);
  });

  /* Counting numbers */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, to = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '', t0 = null, d = 1400;
        function step(t) {
          if (t0 === null) t0 = t;
          var p = Math.min((t - t0) / d, 1), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
          el.textContent = v + suf;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: .6 });
    document.querySelectorAll('[data-count]').forEach(function (el) { io.observe(el); });
  }

  /* Copy the email address */
  document.querySelectorAll('.copy').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-copy');
      function done() { b.textContent = 'Copiato'; setTimeout(function () { b.textContent = 'Copia'; }, 1600); }
      function sel() {
        var a = b.parentNode.querySelector('a');
        var r = document.createRange(); r.selectNodeContents(a);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      }
      try { navigator.clipboard.writeText(t).then(done, sel); } catch (e) { sel(); }
    });
  });

  /* Side menu */
  var root = document.documentElement;
  var btn = document.getElementById('menu-btn');
  var dr = document.getElementById('drawer');
  var scrim = document.getElementById('scrim');
  var closeBtn = document.getElementById('drawer-close');
  if (btn && dr) {
    var setOpen = function (o) {
      root.classList.toggle('menu-open', o);
      btn.setAttribute('aria-expanded', o ? 'true' : 'false');
      dr.setAttribute('aria-hidden', o ? 'false' : 'true');
      if (o) { setTimeout(function () { closeBtn.focus(); }, 60); } else { btn.focus(); }
    };
    btn.addEventListener('click', function () { setOpen(!root.classList.contains('menu-open')); });
    closeBtn.addEventListener('click', function () { setOpen(false); });
    if (scrim) scrim.addEventListener('click', function () { setOpen(false); });
    dr.querySelectorAll('a[aria-current="page"]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); setOpen(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (!root.classList.contains('menu-open')) return;
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key === 'Tab') {
        var f = dr.querySelectorAll('a,button');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* Back to top, with scroll progress */
  var tt = document.getElementById('totop');
  if (tt) {
    var prg = tt.querySelector('.prg');
    var upd = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(window.scrollY / h, 1) : 0;
      prg.style.strokeDashoffset = (1 - p).toFixed(3);
      tt.classList.toggle('show', window.scrollY > 700);
    };
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
    tt.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  if (!fine || reduce) return;

  /* Magnetic buttons */
  document.querySelectorAll('.btn').forEach(function (b) {
    b.addEventListener('mousemove', function (e) {
      var r = b.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) * .18;
      var dy = (e.clientY - (r.top + r.height / 2)) * .3;
      b.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
    });
    b.addEventListener('mouseleave', function () { b.style.transform = ''; });
  });

  /* Portrait tilts with the pointer */
  var hf = document.querySelector('.hero-frame'), pw = document.querySelector('.photo-wrap');
  if (hf && pw) {
    hf.addEventListener('mousemove', function (e) {
      var r = hf.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
      pw.style.transform = 'perspective(1000px) rotateY(' + (nx * 6).toFixed(2) + 'deg) rotateX(' + (-ny * 5).toFixed(2) + 'deg)';
    });
    hf.addEventListener('mouseleave', function () { pw.style.transform = ''; });
  }

  /* Soft light that follows the pointer in dark sections */
  document.querySelectorAll('.band').forEach(function (band) {
    band.addEventListener('mousemove', function (e) {
      var r = band.getBoundingClientRect();
      band.style.setProperty('--gx', (e.clientX - r.left) + 'px');
      band.style.setProperty('--gy', (e.clientY - r.top) + 'px');
    });
  });
})();
