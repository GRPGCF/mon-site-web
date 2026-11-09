/* GCF Spa : carte interactive du siège.
   Leaflet est hébergé sur le site (lib/leaflet). Aucune requête vers un service externe
   n'est faite tant que le visiteur n'a pas cliqué sur « Afficher la carte », et la position
   du visiteur n'est demandée qu'après un clic sur « Me localiser ». Elle reste dans le navigateur. */
(function () {
  'use strict';

  var bloc = document.getElementById('carte');
  if (!bloc) return;

  var bAfficher = document.getElementById('carte-afficher');
  var bLocaliser = document.getElementById('carte-localiser');
  var statut = document.getElementById('carte-statut');
  var zone = document.getElementById('carte-zone');
  var lienOsm = document.getElementById('lien-osm');
  var lienGoogle = document.getElementById('lien-google');
  if (!bAfficher || !bLocaliser || !statut || !zone) return;

  /* Siège : coordonnées lues dans les attributs data-* du bloc #carte (index.html) */
  var SIEGE = {
    lat: parseFloat(bloc.getAttribute('data-lat')),
    lon: parseFloat(bloc.getAttribute('data-lon')),
    adresse: bloc.getAttribute('data-adresse') || ''
  };

  /* Filiales : positions au centre de la commune (approximatives). À affiner avec les adresses exactes. */
  var FILIALES = [
    { noms: ['SETIRAIL', 'INFRARAIL', 'INFRAFER'], lieu: 'Rouiba, Alger', lat: 36.73829, lon: 3.28079 },
    { noms: ['RAILELECTR'], lieu: 'Hussein Dey, Alger', lat: 36.74294, lon: 3.09403 }
  ];

  var L = null;
  var carte = null;
  var moi = null, trait = null, cercle = null;
  var reduit = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function dire(texte) { statut.textContent = texte; }

  function charger(src, ok, ko) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = ok;
    s.onerror = ko;
    document.head.appendChild(s);
  }

  function icone(classe) {
    return L.divIcon({ className: 'pin ' + classe, html: '<span></span>', iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -16] });
  }

  function popup(titre, ligne) {
    var d = document.createElement('div');
    var t = document.createElement('strong');
    t.textContent = titre;
    d.appendChild(t);
    if (ligne) {
      d.appendChild(document.createElement('br'));
      d.appendChild(document.createTextNode(ligne));
    }
    return d;
  }

  function creerCarte() {
    L = window.L;
    zone.textContent = '';
    carte = L.map(zone, { scrollWheelZoom: false });
    var erreursTuiles = 0;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      referrerPolicy: 'origin',
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">contributeurs d’OpenStreetMap</a>'
    }).on('tileerror', function () {
      erreursTuiles++;
      if (erreursTuiles === 4) {
        dire('Le fond de carte n’a pas pu être chargé (accès refusé ou connexion indisponible). Les positions restent affichées : utilisez les liens d’itinéraire ci-dessous.');
      }
    }).addTo(carte);

    var points = [[SIEGE.lat, SIEGE.lon]];

    L.marker([SIEGE.lat, SIEGE.lon], { icon: icone('pin-siege'), title: 'Siège de GCF Spa', alt: 'Siège de GCF Spa', zIndexOffset: 1000 })
      .addTo(carte)
      .bindPopup(popup('Siège de GCF Spa', SIEGE.adresse));

    FILIALES.forEach(function (f) {
      var nom = f.noms.join(', ');
      L.marker([f.lat, f.lon], { icon: icone('pin-filiale'), title: nom, alt: nom })
        .addTo(carte)
        .bindPopup(popup(nom, f.lieu + ' (position approximative)'));
      points.push([f.lat, f.lon]);
    });

    carte.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 13, animate: false });

    bAfficher.hidden = true;
    bLocaliser.hidden = false;
    bLocaliser.focus();
    dire('Carte affichée. Cliquez sur « Me localiser » pour calculer votre distance par rapport au siège.');
  }

  function distanceKm(lat1, lon1, lat2, lon2) {
    var R = 6371, rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function cap(lat1, lon1, lat2, lon2) {
    var rad = Math.PI / 180;
    var y = Math.sin((lon2 - lon1) * rad) * Math.cos(lat2 * rad);
    var x = Math.cos(lat1 * rad) * Math.sin(lat2 * rad) -
            Math.sin(lat1 * rad) * Math.cos(lat2 * rad) * Math.cos((lon2 - lon1) * rad);
    var deg = (Math.atan2(y, x) / rad + 360) % 360;
    var points = ['au nord', 'au nord-est', 'à l’est', 'au sud-est', 'au sud', 'au sud-ouest', 'à l’ouest', 'au nord-ouest'];
    return points[Math.round(deg / 45) % 8];
  }

  function texteDistance(km, direction, precision) {
    var d = km < 1 ? Math.round(km * 1000) + ' m'
          : (km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km).toLocaleString('fr-FR')) + ' km';
    var t = 'Vous êtes à environ ' + d + ' du siège de GCF Spa, à vol d’oiseau. Le siège se trouve ' + direction + ' de votre position.';
    if (precision) t += ' Précision de la localisation : ± ' + Math.round(precision) + ' m.';
    return t;
  }

  function majLiens(lat, lon) {
    if (lienOsm) {
      lienOsm.href = 'https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=' +
        encodeURIComponent(lat + ',' + lon + ';' + SIEGE.lat + ',' + SIEGE.lon);
      lienOsm.textContent = 'Itinéraire depuis ma position (OpenStreetMap)';
    }
    if (lienGoogle) {
      lienGoogle.href = 'https://www.google.com/maps/dir/?api=1&origin=' + lat + ',' + lon +
        '&destination=' + SIEGE.lat + ',' + SIEGE.lon + '&travelmode=driving';
      lienGoogle.textContent = 'Itinéraire depuis ma position (Google Maps)';
    }
  }

  function succes(p) {
    bLocaliser.disabled = false;
    var lat = p.coords.latitude, lon = p.coords.longitude, prec = p.coords.accuracy;

    [moi, trait, cercle].forEach(function (c) { if (c) carte.removeLayer(c); });
    if (prec && prec < 20000) {
      cercle = L.circle([lat, lon], { radius: prec, color: '#24608f', weight: 1, fillColor: '#24608f', fillOpacity: 0.1 }).addTo(carte);
    }
    trait = L.polyline([[lat, lon], [SIEGE.lat, SIEGE.lon]], { color: '#f2b705', weight: 4, dashArray: '8 8' }).addTo(carte);
    moi = L.marker([lat, lon], { icon: icone('pin-moi'), title: 'Votre position', alt: 'Votre position', zIndexOffset: 900 })
      .addTo(carte)
      .bindPopup(popup('Votre position', 'Calculée par votre navigateur'));

    carte.fitBounds(L.latLngBounds([[lat, lon], [SIEGE.lat, SIEGE.lon]]), { padding: [50, 50], maxZoom: 15, animate: !reduit });

    var km = distanceKm(lat, lon, SIEGE.lat, SIEGE.lon);
    dire(texteDistance(km, cap(lat, lon, SIEGE.lat, SIEGE.lon), prec));
    majLiens(lat, lon);
  }

  function echec(e) {
    bLocaliser.disabled = false;
    var messages = {
      1: 'Localisation refusée. Vous pouvez l’autoriser dans les réglages de votre navigateur, ou utiliser les liens d’itinéraire ci-dessous.',
      2: 'Votre position n’a pas pu être déterminée.',
      3: 'La recherche de votre position a pris trop de temps. Veuillez réessayer.'
    };
    dire(messages[e && e.code] || messages[2]);
  }

  bAfficher.addEventListener('click', function () {
    bAfficher.disabled = true;
    dire('Chargement de la carte…');
    charger('lib/leaflet/leaflet.js', creerCarte, function () {
      bAfficher.disabled = false;
      dire('La carte n’a pas pu être chargée. Utilisez les liens d’itinéraire ci-dessous.');
    });
  });

  bLocaliser.addEventListener('click', function () {
    if (!('geolocation' in navigator)) {
      dire('La géolocalisation n’est pas disponible sur ce navigateur.');
      return;
    }
    bLocaliser.disabled = true;
    dire('Recherche de votre position… Votre navigateur va vous demander votre autorisation.');
    navigator.geolocation.getCurrentPosition(succes, echec, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
  });
})();
