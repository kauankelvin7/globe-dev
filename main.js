var GITHUB_USER = "kauankelvin7";
var TOKEN = ""; // coloque seu token aqui se tiver: github.com/settings/tokens

// ── TEXTURAS ONLINE (nao precisam de arquivos locais) ─────────────────────────
// Voce pode substituir por arquivos locais se tiver em textures/
var TEXTURES = {
  earth:    "https://raw.githubusercontent.com/mrdoob/three.js/r134/examples/textures/planets/earth_atmos_2048.jpg",
  // Opcionais — so carregam se o arquivo local existir
  specular: "textures/earth_specular.jpg",
  clouds:   "textures/earth_clouds.jpg",
  night:    "textures/earth_night.jpg",
  bump:     "textures/earth_bump.jpg"
};

var LANG_COLORS = {
  "JavaScript": 0xf7df1e, "TypeScript": 0x3178c6, "Python": 0x3572A5,
  "Java": 0xb07219, "C++": 0xf34b7d, "C#": 0x178600, "Go": 0x00ADD8,
  "Rust": 0xdea584, "HTML": 0xe34c26, "CSS": 0x563d7c, "Shell": 0x89e051,
  "Vue": 0x41b883, "PHP": 0x4F5D95, "default": 0x00d4ff
};

function getLangColor(lang) {
  return LANG_COLORS[lang] || LANG_COLORS["default"];
}

// ── SCENE ──────────────────────────────────────────────────────────────────────
var scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000008, 0.01);

var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0.4, 2.9);

var renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("#bg"), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

// ── CONTROLS ───────────────────────────────────────────────────────────────────
var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.04;
controls.minDistance = 1.4; controls.maxDistance = 7;
controls.autoRotate = true; controls.autoRotateSpeed = 0.25;
controls.enablePan = false;

// ── TEXTURE LOADER COM FALLBACK ────────────────────────────────────────────────
var txLoader = new THREE.TextureLoader();
txLoader.crossOrigin = "anonymous";

// Carrega textura — se falhar, usa textura em branco (nao quebra o app)
function loadTex(url, fallbackColor) {
  var tex = new THREE.Texture();
  txLoader.load(
    url,
    function(t) { tex.image = t.image; tex.needsUpdate = true; },
    undefined,
    function() {
      // Falhou — cria canvas colorido de fallback
      var c = document.createElement("canvas");
      c.width = c.height = 2;
      var ctx = c.getContext("2d");
      ctx.fillStyle = fallbackColor || "#111122";
      ctx.fillRect(0, 0, 2, 2);
      tex.image = c; tex.needsUpdate = true;
    }
  );
  return tex;
}

var earthMap    = loadTex(TEXTURES.earth,    "#1a2a4a");
var specularMap = loadTex(TEXTURES.specular, "#222222");
var cloudsMap   = loadTex(TEXTURES.clouds,   "#000000");
var nightMap    = loadTex(TEXTURES.night,    "#000000");
var bumpMap     = loadTex(TEXTURES.bump,     "#888888");

// ── STARS BACKGROUND — gerado via canvas, sem depender de arquivo ─────────────
function makeStarsTexture() {
  var size = 2048;
  var cv   = document.createElement("canvas");
  cv.width = cv.height = size;
  var ctx  = cv.getContext("2d");

  ctx.fillStyle = "#00000e";
  ctx.fillRect(0, 0, size, size);

  // Estrelas pequenas com cor levemente variada
  for (var i = 0; i < 3000; i++) {
    var x   = Math.random() * size;
    var y   = Math.random() * size;
    var r   = Math.random() * 1.3 + 0.15;
    var op  = Math.random() * 0.75 + 0.25;
    var hue = Math.random() < 0.3 ? 210 : Math.random() < 0.5 ? 40 : 0;
    var sat = Math.random() < 0.4 ? 60 : 0;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "hsla(" + hue + "," + sat + "%,100%," + op + ")";
    ctx.fill();
  }

  // Estrelas brilhantes com glow
  for (var j = 0; j < 80; j++) {
    var bx   = Math.random() * size;
    var by   = Math.random() * size;
    var brad = Math.random() * 1.2 + 0.8;
    var g    = ctx.createRadialGradient(bx, by, 0, bx, by, brad * 5);
    g.addColorStop(0,   "rgba(210,225,255,0.95)");
    g.addColorStop(0.3, "rgba(150,180,255,0.25)");
    g.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.arc(bx, by, brad * 5, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }

  return new THREE.CanvasTexture(cv);
}

var starsBg = new THREE.Mesh(
  new THREE.SphereGeometry(80, 64, 64),
  new THREE.MeshBasicMaterial({ map: makeStarsTexture(), side: THREE.BackSide })
);
scene.add(starsBg);

// ── PARTICLE STARS ────────────────────────────────────────────────────────────
(function() {
  var count = 4000, pos = new Float32Array(count * 3);
  for (var i = 0; i < count; i++) {
    var r = 30 + Math.random() * 40;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i*3+2] = r * Math.cos(phi);
  }
  var geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.04, color: 0xffffff, transparent: true, opacity: 0.7, sizeAttenuation: true
  })));
})();

// ── EARTH ─────────────────────────────────────────────────────────────────────
var globe = new THREE.Mesh(
  new THREE.SphereGeometry(1, 96, 96),
  new THREE.MeshPhongMaterial({
    map: earthMap, specularMap: specularMap,
    specular: new THREE.Color(0x446688), shininess: 30,
    bumpMap: bumpMap, bumpScale: 0.04
  })
);
globe.receiveShadow = true; globe.castShadow = true;
scene.add(globe);

// ── NIGHT SHADER ──────────────────────────────────────────────────────────────
scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(1.001, 96, 96),
  new THREE.ShaderMaterial({
    uniforms: {
      nightMap: { value: nightMap },
      sunDir:   { value: new THREE.Vector3(5, 3, 5).normalize() }
    },
    vertexShader: [
      "varying vec2 vUv; varying vec3 vNormal;",
      "void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);",
      "gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}"
    ].join("\n"),
    fragmentShader: [
      "uniform sampler2D nightMap; uniform vec3 sunDir;",
      "varying vec2 vUv; varying vec3 vNormal;",
      "void main(){float d=dot(vNormal,sunDir);float t=smoothstep(-0.2,0.3,d);",
      "vec4 n=texture2D(nightMap,vUv);float a=(1.0-t)*n.r*1.8;",
      "gl_FragColor=vec4(n.rgb*1.5,clamp(a,0.0,1.0));}"
    ].join("\n"),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  })
));

// ── CLOUDS ────────────────────────────────────────────────────────────────────
var clouds = new THREE.Mesh(
  new THREE.SphereGeometry(1.012, 96, 96),
  new THREE.MeshPhongMaterial({ map: cloudsMap, transparent: true, opacity: 0.38, depthWrite: false })
);
scene.add(clouds);

// ── ATMOSPHERE Fresnel ────────────────────────────────────────────────────────
scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(1.15, 64, 64),
  new THREE.ShaderMaterial({
    uniforms: { sunDir: { value: new THREE.Vector3(5,3,5).normalize() }, glowColor: { value: new THREE.Color(0x4488ff) } },
    vertexShader: "varying vec3 vN,vV;void main(){vN=normalize(normalMatrix*normal);vec4 wp=modelMatrix*vec4(position,1.0);vV=normalize(cameraPosition-wp.xyz);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader: "uniform vec3 sunDir,glowColor;varying vec3 vN,vV;void main(){float f=pow(1.0-max(dot(vN,vV),0.0),3.5);float s=max(dot(vN,sunDir),0.0);vec3 col=mix(glowColor,vec3(0.6,0.8,1.0),s*0.5);gl_FragColor=vec4(col,f*0.7);}",
    transparent: true, side: THREE.FrontSide, depthWrite: false, blending: THREE.AdditiveBlending
  })
));
scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(1.02, 64, 64),
  new THREE.ShaderMaterial({
    uniforms: { sunDir: { value: new THREE.Vector3(5,3,5).normalize() } },
    vertexShader: "varying vec3 vN,vV;void main(){vN=normalize(normalMatrix*normal);vec4 wp=modelMatrix*vec4(position,1.0);vV=normalize(cameraPosition-wp.xyz);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader: "uniform vec3 sunDir;varying vec3 vN,vV;void main(){float rim=pow(1.0-max(dot(vN,vV),0.0),5.0);float sun=smoothstep(0.0,1.0,dot(vN,sunDir)+0.3);gl_FragColor=vec4(0.4,0.75,1.0,rim*sun*0.5);}",
    transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending
  })
));

// ── LIGHTING ──────────────────────────────────────────────────────────────────
var sunLight = new THREE.DirectionalLight(0xfff5e8, 2.0);
sunLight.position.set(5, 3, 5); sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
scene.add(sunLight);
var fillLight = new THREE.DirectionalLight(0x1a3060, 0.3);
fillLight.position.set(-5, -2, -5); scene.add(fillLight);
scene.add(new THREE.AmbientLight(0x111830, 0.6));

// ── UTIL ──────────────────────────────────────────────────────────────────────
function latLngToVector(lat, lng, radius) {
  radius = radius || 1;
  var phi   = (90 - lat)  * (Math.PI / 180);
  var theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ── REPO POINTS ───────────────────────────────────────────────────────────────
var repoMeshes = [];

function createPoint(lat, lng, repo, intensity) {
  var color  = getLangColor(repo.language);
  var size   = 0.014 + intensity * 0.028;
  var pos    = latLngToVector(lat, lng, 1.003);

  var spikeH   = size * 4 + intensity * 0.06;
  var spikeMid = latLngToVector(lat, lng, 1.003 + spikeH / 2);
  var spike    = new THREE.Mesh(
    new THREE.CylinderGeometry(0, size * 0.6, spikeH, 8),
    new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.75 })
  );
  spike.position.copy(spikeMid);
  spike.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), pos.clone().normalize());
  scene.add(spike);

  var ring = new THREE.Mesh(
    new THREE.RingGeometry(size * 2.2, size * 3.2, 32),
    new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
  );
  ring.position.copy(pos); ring.lookAt(pos.clone().multiplyScalar(2));
  scene.add(ring);

  var halo = new THREE.Mesh(
    new THREE.SphereGeometry(size * 3.5, 12, 12),
    new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.07, depthWrite: false })
  );
  halo.position.copy(pos); scene.add(halo);

  var dot = new THREE.Mesh(
    new THREE.SphereGeometry(size, 20, 20),
    new THREE.MeshBasicMaterial({ color: color })
  );
  dot.position.copy(pos);
  dot.userData = { url: repo.html_url, name: repo.name, lang: repo.language || "?",
    stars: repo.stargazers_count || 0, desc: repo.description || "",
    pulse: Math.random() * Math.PI * 2, ring: ring, halo: halo };
  scene.add(dot);
  repoMeshes.push(dot);
}

// ── CONNECTIONS ───────────────────────────────────────────────────────────────
function createConnection(lat1, lng1, lat2, lng2, color) {
  var start = latLngToVector(lat1, lng1), end = latLngToVector(lat2, lng2);
  var midAlt = 0.18 + start.distanceTo(end) * 0.15, pts = [];
  for (var i = 0; i <= 80; i++) {
    var t = i / 80, p = new THREE.Vector3().lerpVectors(start, end, t);
    p.normalize().multiplyScalar(1 + Math.sin(Math.PI * t) * midAlt);
    pts.push(p);
  }
  var geo = new THREE.BufferGeometry().setFromPoints(pts);
  scene.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: color,    transparent: true, opacity: 0.55 })));
  scene.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 })));
}

var travelDots = [];
function createTravelDot(lat1, lng1, lat2, lng2, color) {
  var start = latLngToVector(lat1, lng1), end = latLngToVector(lat2, lng2);
  var midAlt = 0.18 + start.distanceTo(end) * 0.15, pts = [];
  for (var i = 0; i <= 20; i++) {
    var t = i / 20, p = new THREE.Vector3().lerpVectors(start, end, t);
    p.normalize().multiplyScalar(1 + Math.sin(Math.PI * t) * midAlt);
    pts.push(p);
  }
  var dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.011, 8, 8),
    new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9 })
  );
  scene.add(dot);
  travelDots.push({ mesh: dot, curve: new THREE.CatmullRomCurve3(pts), t: Math.random(), speed: 0.0018 + Math.random() * 0.001 });
}

// ── API COM FALLBACK PARA DADOS DEMO ──────────────────────────────────────────
function apiFetch(url) {
  var h = {};
  if (TOKEN) h["Authorization"] = "token " + TOKEN;
  return fetch(url, { headers: h }).then(function(r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  });
}

// Dados demo usados quando a API do GitHub retorna 403 (limite atingido)
var DEMO_REPOS = [
  { html_url: "https://github.com/" + GITHUB_USER, name: "portfolio",       language: "JavaScript", stargazers_count: 12, description: "Portfolio pessoal" },
  { html_url: "https://github.com/" + GITHUB_USER, name: "api-server",      language: "JavaScript", stargazers_count: 5,  description: "API REST Node.js" },
  { html_url: "https://github.com/" + GITHUB_USER, name: "ml-experiments",  language: "Python",     stargazers_count: 8,  description: "Machine learning" },
  { html_url: "https://github.com/" + GITHUB_USER, name: "data-pipeline",   language: "Python",     stargazers_count: 3,  description: "ETL pipeline" },
  { html_url: "https://github.com/" + GITHUB_USER, name: "mobile-app",      language: "TypeScript", stargazers_count: 20, description: "App React Native" },
  { html_url: "https://github.com/" + GITHUB_USER, name: "dashboard-ui",    language: "TypeScript", stargazers_count: 7,  description: "Dashboard analytics" },
  { html_url: "https://github.com/" + GITHUB_USER, name: "cli-tool",        language: "Go",         stargazers_count: 4,  description: "CLI utilitario" },
  { html_url: "https://github.com/" + GITHUB_USER, name: "globe-dev",       language: "JavaScript", stargazers_count: 15, description: "Este projeto!" },
];

var LAT_BANDS = [
  [-35,-10],[10,55],[30,60],[-30,0],[20,50],
  [35,65],[-25,5],[40,70],[-15,20],[50,70],[25,55],[-40,-5]
];

function spawnRepos(repos, isDemo) {
  var positions = [];
  repos.forEach(function(repo, i) {
    var intensity = Math.min((repo.stargazers_count || 1) / 20, 1);
    var band = LAT_BANDS[i % LAT_BANDS.length];
    var lat  = band[0] + Math.random() * (band[1] - band[0]);
    var lng  = Math.random() * 320 - 160;
    createPoint(lat, lng, repo, intensity);
    positions.push({ lat: lat, lng: lng, lang: repo.language });
  });
  buildConnections(positions);
  hideLoader();
  setStatus((isDemo ? "Demo — " : "") + repos.length + " repositorios" + (isDemo ? " (adicione TOKEN para dados reais)" : " carregados"));
}

function loadData() {
  setStatus("Conectando ao GitHub...");

  apiFetch("https://api.github.com/users/" + GITHUB_USER + "/repos?per_page=30&sort=updated")
    .then(function(repos) {
      if (!Array.isArray(repos) || repos.length === 0) {
        console.warn("API retornou vazio, usando demo.");
        spawnRepos(DEMO_REPOS, true);
        return;
      }
      // Sucesso — usa dados reais (commits = estrelas como proxy rapido, evita requests extras)
      var valid = repos.filter(function(r) { return !r.fork; }).slice(0, 12);
      spawnRepos(valid, false);
    })
    .catch(function(err) {
      console.warn("GitHub API erro (" + err.message + "), usando dados demo.");
      setStatus("API indisponivel — mostrando demo");
      spawnRepos(DEMO_REPOS, true);
    });
}

function buildConnections(pos) {
  for (var a = 0; a < pos.length; a++) {
    for (var b = a + 1; b < pos.length; b++) {
      if (pos[a].lang && pos[a].lang === pos[b].lang) {
        var c = getLangColor(pos[a].lang);
        createConnection(pos[a].lat, pos[a].lng, pos[b].lat, pos[b].lng, c);
        if (Math.random() > 0.35) createTravelDot(pos[a].lat, pos[a].lng, pos[b].lat, pos[b].lng, c);
      }
    }
  }
}

function hideLoader() {
  var el = document.getElementById("loader");
  if (!el) return;
  el.style.opacity = "0";
  setTimeout(function() { el.style.display = "none"; }, 800);
}
function setStatus(t) {
  var el = document.getElementById("repo-count");
  if (el) el.textContent = t;
}

loadData();

// ── RAYCASTER / TOOLTIP ───────────────────────────────────────────────────────
var raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();
var tooltipEl = document.getElementById("tooltip"), hoveredObj = null;

window.addEventListener("mousemove", function(e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (e.clientY / window.innerHeight) * -2 + 1;
  raycaster.setFromCamera(mouse, camera);
  var hits = raycaster.intersectObjects(repoMeshes);
  if (hits.length > 0) {
    hoveredObj = hits[0].object;
    var d = hoveredObj.userData;
    var hex = "#" + getLangColor(d.lang).toString(16).padStart(6, "0");
    tooltipEl.style.display = "block";
    tooltipEl.style.left = (e.clientX + 16) + "px";
    tooltipEl.style.top  = (e.clientY - 12) + "px";
    tooltipEl.innerHTML =
      '<div class="tooltip-name">' + d.name + "</div>" +
      '<div class="tooltip-lang" style="color:' + hex + '">' + d.lang + "</div>" +
      (d.desc ? '<div class="tooltip-desc">' + d.desc.slice(0, 60) + (d.desc.length > 60 ? "…" : "") + "</div>" : "") +
      '<div class="tooltip-stars">&#9733; ' + d.stars + "</div>" +
      '<div class="tooltip-hint">clique para abrir</div>';
    document.body.style.cursor = "pointer";
    controls.autoRotate = false;
  } else {
    hoveredObj = null;
    tooltipEl.style.display = "none";
    document.body.style.cursor = "default";
    controls.autoRotate = true;
  }
});

window.addEventListener("click", function(e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (e.clientY / window.innerHeight) * -2 + 1;
  raycaster.setFromCamera(mouse, camera);
  var hits = raycaster.intersectObjects(repoMeshes);
  if (hits.length > 0 && hits[0].object.userData.url) {
    window.open(hits[0].object.userData.url, "_blank");
  }
});

// ── ANIMATE ───────────────────────────────────────────────────────────────────
var clock = new THREE.Clock(), time = 0;

function animate() {
  requestAnimationFrame(animate);
  time += clock.getDelta();
  controls.update();
  clouds.rotation.y  += 0.00007;
  starsBg.rotation.y += 0.00002;

  repoMeshes.forEach(function(mesh) {
    var p = mesh.userData.pulse;
    var s = 1 + Math.sin(time * 1.8 + p) * 0.22;
    mesh.scale.setScalar(mesh === hoveredObj ? s * 1.7 : s);
    if (mesh.userData.ring) {
      var rs = 1 + Math.sin(time * 1.4 + p + 1) * 0.45;
      mesh.userData.ring.scale.setScalar(rs);
      mesh.userData.ring.material.opacity = 0.07 + Math.sin(time * 1.4 + p) * 0.07;
    }
    if (mesh.userData.halo) {
      mesh.userData.halo.material.opacity = 0.04 + Math.sin(time * 1.2 + p) * 0.04;
    }
  });

  travelDots.forEach(function(td) {
    td.t = (td.t + td.speed) % 1;
    td.curve.getPoint(td.t, td.mesh.position);
  });

  renderer.render(scene, camera);
}
animate();

// ── RESIZE ────────────────────────────────────────────────────────────────────
window.addEventListener("resize", function() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});