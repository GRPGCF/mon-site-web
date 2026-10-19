/* GCF Spa : menu mobile, apparition au défilement et pause des animations (aucune dépendance externe) */
document.documentElement.classList.add('js');
document.addEventListener('DOMContentLoaded', function () {
  /* Menu mobile */
  var bouton = document.querySelector('.menu-bouton');
  var menu = document.getElementById('menu');
  if (bouton && menu) {
    var fermer = function () { menu.classList.remove('ouvert'); bouton.setAttribute('aria-expanded', 'false'); };
    bouton.addEventListener('click', function () {
      var ouvert = menu.classList.toggle('ouvert');
      bouton.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') fermer(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { fermer(); bouton.focus(); } });
  }

  /* Apparition progressive des blocs au défilement */
  var blocs = document.querySelectorAll('.reveal');
  var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduit) {
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    blocs.forEach(function (b) { obs.observe(b); });
  } else {
    blocs.forEach(function (b) { b.classList.add('visible'); });
  }

  /* Pause / reprise des animations */
  var pause = document.querySelector('.pause-anim');
  if (pause) {
    pause.addEventListener('click', function () {
      var enPause = document.documentElement.classList.toggle('anim-pause');
      pause.setAttribute('aria-pressed', enPause ? 'true' : 'false');
      pause.textContent = enPause ? 'Reprendre l’animation' : 'Mettre en pause l’animation';
    });
  }
});
