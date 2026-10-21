/* Kit compartido de dinosaurios: materiales caricatura, contornos y los 8 modelos (mirando hacia -Z) */
/* ---------- Ayudas de geometría ---------- */
// Sombreado tipo caricatura: 3 tonos de luz
const GRAD = (() => {
  const t = new THREE.DataTexture(new Uint8Array([120, 120, 120, 255, 190, 190, 190, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t;
})();
const matCache = {};
const M = (c, opts) => {
  const k = c + (opts ? JSON.stringify(opts) : '');
  return matCache[k] || (matCache[k] = new THREE.MeshLambertMaterial(Object.assign({ color: c }, opts || {})));
};
const SPH = new THREE.SphereGeometry(1, 16, 12);
function ell(rx, ry, rz, m) { const o = new THREE.Mesh(SPH, m); o.scale.set(rx, ry, rz); o.castShadow = true; return o; }
function cyl(rt, rb, h, m, seg = 10) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.castShadow = true; return o; }
function cone(r, h, m, seg = 10) { const o = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), m); o.castShadow = true; return o; }
function box(w, h, d, m) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.castShadow = true; o.receiveShadow = true; return o; }
function shade(hex, l) { const c = new THREE.Color(hex); c.offsetHSL(0, 0, l); return c.getHex(); }
const SHINE = new THREE.MeshBasicMaterial({ color: 0xffffff });
function eyes(g, x, y, z, r) {
  for (const s of [-1, 1]) {
    const w = ell(r, r, r, M(0xffffff)); w.position.set(s * x, y, z); g.add(w);
    const p = ell(r * .55, r * .6, r * .55, M(0x1a1420)); p.position.set(s * (x + r * .5), y + r * .05, z - r * .35); p.userData.noOutline = true; g.add(p);
    const h = new THREE.Mesh(SPH, SHINE); h.scale.setScalar(r * .2); h.position.set(s * (x + r * .62), y + r * .3, z - r * .62); h.userData.noOutline = true; g.add(h);
  }
}
// Contorno de caricatura (casco invertido) para los dinosaurios
const OUT_MAT = new THREE.MeshBasicMaterial({ color: 0x2a1f3d, side: THREE.BackSide });
function addOutlines(root) {
  return;   // luz suave: ya no se usan contornos
  const list = [];
  root.traverse(o => {
    if (o.isMesh && !o.userData.noOutline && o.material.side !== THREE.DoubleSide && o.material.color && o.material.color.getHex() !== 0xffffff) list.push(o);
  });
  for (const o of list) { const h = new THREE.Mesh(o.geometry, OUT_MAT); h.scale.setScalar(1.08); h.userData.noOutline = true; o.add(h); }
}
const IVORY = 0xf4e8c8;

/* ---------- Dinosaurios (mirando hacia -Z) ---------- */
function buildRaptor(c) {
  const g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
  const body = M(c), belly = M(shade(c, .2)), dark = M(shade(c, -.15));
  const torso = ell(.5, .48, .85, body); torso.position.set(0, 1.45, 0); torso.rotation.x = .12; rig.add(torso);
  const bel = ell(.4, .36, .7, belly); bel.position.set(0, 1.3, -.08); rig.add(bel);
  for (let i = 0; i < 3; i++) { const s = ell(.18, .06, .12, dark); s.position.set(0, 1.9, -.3 + i * .32); rig.add(s); }
  const neck = cyl(.2, .3, 1.1, body); neck.position.set(0, 2.05, -.65); neck.rotation.x = -.6; rig.add(neck);
  const head = new THREE.Group(); head.position.set(0, 2.6, -1.0); rig.add(head);
  head.add(ell(.3, .27, .45, body));
  const snout = ell(.22, .17, .32, body); snout.position.set(0, -.07, -.4); head.add(snout);
  eyes(head, .2, .1, -.12, .09); g.userData.head = head;
  const tailP = new THREE.Group(); tailP.position.set(0, 1.5, .7); rig.add(tailP);
  const tail = cone(.36, 1.9, body); tail.rotation.x = Math.PI / 2 + .15; tail.position.z = .95; tailP.add(tail);
  const legs = [];
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(s * .3, 1.35, .1); rig.add(p);
    const th = ell(.2, .45, .26, body); th.position.y = -.3; p.add(th);
    const sh = cyl(.09, .11, .75, dark); sh.position.set(0, -.85, .08); p.add(sh);
    const ft = ell(.15, .07, .28, dark); ft.position.set(0, -1.27, -.12); p.add(ft);
    legs.push(p);
    const arm = cyl(.05, .07, .4, body); arm.position.set(s * .32, 1.55, -.6); arm.rotation.x = -.9; rig.add(arm);
  }
  return { g, anim(t, spd) {
    const a = Math.min(1, spd / 8) * .9;
    legs[0].rotation.x = Math.sin(t * 1.4) * a; legs[1].rotation.x = -Math.sin(t * 1.4) * a;
    rig.position.y = Math.abs(Math.cos(t * 1.4)) * .12 * a;
    tailP.rotation.y = Math.sin(t * .7) * .25; head.rotation.x = Math.sin(t * 1.4) * .05;
  } };
}

function buildCompy(c) {
  // Pequeñito y rayado: cabe en los túneles
  const r = buildRaptor(c);
  const stripe = M(shade(c, -.22));
  for (let i = 0; i < 4; i++) { const s = ell(.52, .1, .08, stripe); s.position.set(0, 1.55, -.45 + i * .3); r.g.children[0].add(s); }
  r.g.scale.setScalar(.5);
  return { g: r.g, anim: (t, spd) => r.anim(t * 1.6, spd) };
}

function buildTrex(c) {
  const g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
  const body = M(c), belly = M(shade(c, .18)), dark = M(shade(c, -.15));
  const torso = ell(.75, .72, 1.15, body); torso.position.set(0, 2.05, 0); torso.rotation.x = .12; rig.add(torso);
  const bel = ell(.6, .5, .95, belly); bel.position.set(0, 1.85, -.1); rig.add(bel);
  const neck = ell(.45, .5, .55, body); neck.position.set(0, 2.55, -.95); rig.add(neck);
  const head = new THREE.Group(); head.position.set(0, 2.95, -1.35); rig.add(head);
  const skull = ell(.5, .45, .7, body); skull.position.z = -.15; head.add(skull);
  const snout = ell(.42, .3, .5, body); snout.position.set(0, -.08, -.65); head.add(snout);
  const jaw = new THREE.Group(); jaw.position.set(0, -.25, -.05); head.add(jaw);
  const j = ell(.4, .14, .7, belly); j.position.set(0, -.08, -.5); jaw.add(j);
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) { const tt = cone(.05, .16, M(0xffffff), 4); tt.rotation.x = Math.PI; tt.position.set(s * .3, -.3, -.5 - i * .14); head.add(tt); }
  eyes(head, .33, .2, -.3, .1); g.userData.head = head;
  for (const s of [-1, 1]) { const brow = ell(.14, .06, .2, dark); brow.position.set(s * .3, .33, -.3); head.add(brow); }
  const tailP = new THREE.Group(); tailP.position.set(0, 2.05, .95); rig.add(tailP);
  const tail = cone(.55, 2.6, body); tail.rotation.x = Math.PI / 2 + .12; tail.position.z = 1.2; tailP.add(tail);
  for (const s of [-1, 1]) { const arm = cyl(.07, .09, .45, body); arm.position.set(s * .5, 1.95, -.85); arm.rotation.x = -1.1; rig.add(arm); }
  const legs = [];
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(s * .45, 1.9, .15); rig.add(p);
    const th = ell(.34, .7, .45, body); th.position.y = -.4; p.add(th);
    const sh = cyl(.15, .2, 1.0, dark); sh.position.set(0, -1.25, .15); p.add(sh);
    const ft = ell(.25, .1, .45, dark); ft.position.set(0, -1.8, -.15); p.add(ft);
    legs.push(p);
  }
  return { g, anim(t, spd) {
    const a = Math.min(1, spd / 8) * .75;
    legs[0].rotation.x = Math.sin(t * 1.1) * a; legs[1].rotation.x = -Math.sin(t * 1.1) * a;
    rig.position.y = Math.abs(Math.cos(t * 1.1)) * .15 * a;
    tailP.rotation.y = Math.sin(t * .55) * .2;
    jaw.rotation.x = .15 + Math.max(0, Math.sin(t * .4)) * .35;
  } };
}

function buildStego(c) {
  const g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
  const body = M(c), belly = M(shade(c, .18)), plateM = M(0xff8a2a), dark = M(shade(c, -.15));
  const torso = ell(.85, .68, 1.25, body); torso.position.set(0, 1.2, 0); rig.add(torso);
  const bel = ell(.7, .45, 1.05, belly); bel.position.set(0, .95, 0); rig.add(bel);
  const neck = ell(.32, .3, .45, body); neck.position.set(0, 1.0, -1.15); rig.add(neck);
  const head = new THREE.Group(); head.position.set(0, .85, -1.55); rig.add(head);
  head.add(ell(.28, .24, .42, body)); eyes(head, .17, .08, -.1, .08); g.userData.head = head;
  for (let i = 0; i < 6; i++) {
    const h = .5 + Math.sin((i + .5) / 6 * Math.PI) * .35;
    const p = cone(.3, h, plateM, 4); p.scale.x = .25;
    p.position.set((i % 2 ? .12 : -.12), 1.75 + Math.sin((i + .5) / 6 * Math.PI) * .12 + h / 2 - .1, -.85 + i * .36); rig.add(p);
  }
  const tailP = new THREE.Group(); tailP.position.set(0, 1.15, 1.05); rig.add(tailP);
  const tail = cone(.38, 1.7, body); tail.rotation.x = Math.PI / 2 + .25; tail.position.z = .8; tailP.add(tail);
  for (const s of [-1, 1]) { const sp = cone(.08, .5, M(IVORY)); sp.position.set(s * .2, 0, 1.35); sp.rotation.z = -s * 1.1; tailP.add(sp); }
  const legs = [];
  for (const [x, z] of [[-.5, -.7], [.5, -.7], [-.5, .7], [.5, .7]]) {
    const p = new THREE.Group(); p.position.set(x, .95, z); rig.add(p);
    const l = cyl(.2, .18, .9, dark); l.position.y = -.47; p.add(l); legs.push(p);
  }
  return { g, anim(t, spd) {
    const a = Math.min(1, spd / 6) * .6;
    legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 1.1 + (i === 0 || i === 3 ? 0 : Math.PI)) * a; });
    rig.position.y = Math.abs(Math.sin(t * 1.1)) * .06;
    tailP.rotation.y = Math.sin(t * .55) * .3;
  } };
}

function buildTrice(c) {
  const g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
  const body = M(c), belly = M(shade(c, .18)), dark = M(shade(c, -.15)), frillM = M(0xff9a3a), horn = M(IVORY);
  const torso = ell(.9, .75, 1.3, body); torso.position.set(0, 1.3, 0); rig.add(torso);
  const bel = ell(.75, .5, 1.1, belly); bel.position.set(0, 1.0, 0); rig.add(bel);
  const head = new THREE.Group(); head.position.set(0, 1.25, -1.45); rig.add(head);
  head.add(ell(.45, .42, .6, body));
  const beak = cone(.2, .45, dark); beak.rotation.x = -Math.PI / 2 - .3; beak.position.set(0, -.18, -.6); head.add(beak);
  const frill = cyl(1.0, 1.0, .12, frillM, 18); frill.rotation.x = Math.PI / 2 - .45; frill.position.set(0, .45, .3); frill.scale.set(1, 1, .85); head.add(frill);
  for (let i = 0; i < 7; i++) { const a = Math.PI * (i / 6); const d = ell(.12, .12, .08, M(0xffd36a)); d.position.set(Math.cos(a) * .8, .45 + Math.sin(a) * .7, .3 + Math.sin(a) * .25); head.add(d); }
  for (const s of [-1, 1]) { const h = cone(.1, 1.0, horn); h.rotation.x = -Math.PI / 2 + .5; h.position.set(s * .25, .4, -.4); head.add(h); }
  const nh = cone(.08, .4, horn); nh.rotation.x = -Math.PI / 2 + .9; nh.position.set(0, .15, -.55); head.add(nh);
  eyes(head, .33, .15, -.2, .09); g.userData.head = head;
  const tailP = new THREE.Group(); tailP.position.set(0, 1.2, 1.2); rig.add(tailP);
  const tail = cone(.4, 1.3, body); tail.rotation.x = Math.PI / 2 + .2; tail.position.z = .6; tailP.add(tail);
  const legs = [];
  for (const [x, z] of [[-.55, -.75], [.55, -.75], [-.55, .75], [.55, .75]]) {
    const p = new THREE.Group(); p.position.set(x, .98, z); rig.add(p);
    const l = cyl(.24, .22, .95, dark); l.position.y = -.48; p.add(l); legs.push(p);
  }
  return { g, anim(t, spd) {
    const a = Math.min(1, spd / 6) * .6;
    legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 1.1 + (i === 0 || i === 3 ? 0 : Math.PI)) * a; });
    rig.position.y = Math.abs(Math.sin(t * 1.1)) * .07;
    head.rotation.x = Math.sin(t * 1.1) * .06; tailP.rotation.y = Math.sin(t * .55) * .25;
  } };
}

function buildBrachio(c) {
  const g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
  const body = M(c), belly = M(shade(c, .18)), dark = M(shade(c, -.15));
  const torso = ell(.95, .9, 1.45, body); torso.position.set(0, 2.45, 0); torso.rotation.x = -.12; rig.add(torso);
  const bel = ell(.8, .6, 1.2, belly); bel.position.set(0, 2.15, 0); rig.add(bel);
  const neckP = new THREE.Group(); neckP.position.set(0, 2.9, -1.0); rig.add(neckP);
  const neck = cyl(.26, .5, 2.9, body); neck.rotation.x = -.35; neck.position.set(0, 1.35, -.5); neckP.add(neck);
  const head = new THREE.Group(); head.position.set(0, 2.85, -1.05); neckP.add(head);
  const sk = ell(.32, .3, .5, body); sk.position.z = -.12; head.add(sk);
  const bump = ell(.22, .2, .22, body); bump.position.set(0, .22, .02); head.add(bump);
  eyes(head, .22, .1, -.1, .08); g.userData.head = head;
  for (let i = 0; i < 5; i++) { const s = ell(.3, .08, .2, dark); s.position.set(0, 3.25, -.6 + i * .35); rig.add(s); }
  const tailP = new THREE.Group(); tailP.position.set(0, 2.4, 1.3); rig.add(tailP);
  const tail = cone(.45, 2.6, body); tail.rotation.x = Math.PI / 2 + .35; tail.position.z = 1.2; tailP.add(tail);
  const legs = [];
  for (const [x, z, h] of [[-.55, -.8, 2.1], [.55, -.8, 2.1], [-.55, .8, 1.95], [.55, .8, 1.95]]) {
    const p = new THREE.Group(); p.position.set(x, h, z); rig.add(p);
    const l = cyl(.26, .24, h, dark); l.position.y = -h / 2; p.add(l); legs.push(p);
  }
  return { g, anim(t, spd) {
    const a = Math.min(1, spd / 6) * .45;
    legs.forEach((l, i) => { l.rotation.x = Math.sin(t * .9 + (i === 0 || i === 3 ? 0 : Math.PI)) * a; });
    rig.position.y = Math.abs(Math.sin(t * .9)) * .08;
    neckP.rotation.x = Math.sin(t * .45) * .06; neckP.rotation.y = Math.sin(t * .3) * .08;
    tailP.rotation.y = Math.sin(t * .45) * .25;
  } };
}

function buildPtero(c) {
  const g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
  const body = M(c), wingM = M(shade(c, .12), { side: THREE.DoubleSide }), beakM = M(0xffb43a);
  rig.add(ell(.32, .3, .7, body));
  const head = new THREE.Group(); head.position.set(0, .28, -.78); rig.add(head);
  head.add(ell(.24, .22, .32, body));
  const beak = cone(.13, .95, beakM); beak.rotation.x = -Math.PI / 2; beak.position.set(0, -.04, -.62); head.add(beak);
  const crest = cone(.1, .7, M(0xff6a3a)); crest.rotation.x = Math.PI / 2 + .5; crest.position.set(0, .15, .35); head.add(crest);
  eyes(head, .15, .08, -.12, .07); g.userData.head = head;
  const tail = cone(.1, .6, body); tail.rotation.x = Math.PI / 2; tail.position.z = .9; rig.add(tail);
  const wings = [];
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(s * .22, .12, -.05); rig.add(p);
    const geo = new THREE.BufferGeometry();
    const v = [0, 0, -.35, s * 2.5, .05, -.15, s * 1.5, 0, .55, 0, 0, -.35, s * 1.5, 0, .55, 0, 0, .55];
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); geo.computeVertexNormals();
    const w = new THREE.Mesh(geo, wingM); w.castShadow = true; p.add(w);
    const bone = cyl(.05, .07, 2.5, body, 6); bone.rotation.z = Math.PI / 2; bone.position.set(s * 1.25, .03, -.25); p.add(bone);
    wings.push({ p, s });
  }
  for (const s of [-1, 1]) { const f = cyl(.04, .05, .45, M(0xffb43a), 5); f.position.set(s * .15, -.35, .35); f.rotation.x = .9; rig.add(f); }
  return { g, anim(t) {
    wings.forEach(({ p, s }) => { p.rotation.z = s * Math.sin(t * 2.2) * .65; });
    rig.position.y = 1.0 + Math.sin(t * 2.2 + 1) * .15;
  } };
}

function buildMosa(c) {
  const g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
  const body = M(c), belly = M(shade(c, .25)), dark = M(shade(c, -.15));
  const torso = ell(.55, .45, 1.5, body); torso.position.set(0, .45, 0); rig.add(torso);
  const bel = ell(.45, .3, 1.3, belly); bel.position.set(0, .3, 0); rig.add(bel);
  const fin = cone(.3, .6, dark, 4); fin.scale.x = .2; fin.position.set(0, .95, -.1); fin.rotation.x = .4; rig.add(fin);
  const head = new THREE.Group(); head.position.set(0, .55, -1.55); rig.add(head);
  const sk = ell(.36, .28, .7, body); sk.position.z = -.2; head.add(sk);
  const jaw = ell(.28, .12, .6, belly); jaw.position.set(0, -.18, -.25); head.add(jaw);
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) { const tth = cone(.035, .1, M(0xffffff), 4); tth.rotation.x = Math.PI; tth.position.set(s * .2, -.08, -.55 + i * .12); head.add(tth); }
  eyes(head, .25, .14, -.1, .085); g.userData.head = head;
  const tailP = new THREE.Group(); tailP.position.set(0, .45, 1.2); rig.add(tailP);
  const tl = ell(.32, .26, 1.0, body); tl.position.z = .8; tailP.add(tl);
  const tfin = ell(.05, .55, .35, dark); tfin.position.set(0, .15, 1.75); tfin.rotation.x = -.5; tailP.add(tfin);
  const flips = [];
  for (const [x, z] of [[-.55, -.6], [.55, -.6], [-.45, .7], [.45, .7]]) {
    const p = new THREE.Group(); p.position.set(x, .2, z); rig.add(p);
    const f = ell(.5, .06, .2, dark); f.position.x = Math.sign(x) * .4; f.rotation.y = Math.sign(x) * .4; p.add(f); flips.push(p);
  }
  return { g, anim(t) {
    tailP.rotation.y = Math.sin(t * 1.6) * .45; rig.rotation.y = -Math.sin(t * 1.6) * .07;
    head.rotation.y = Math.sin(t * 1.6 + 1) * .08;
    flips.forEach((p, i) => { p.rotation.z = Math.sign(p.position.x) * Math.sin(t * 1.6 + i) * .35; });
  } };
}
const BUILDERS = { raptor: buildRaptor, mosa: buildMosa, stego: buildStego, ptero: buildPtero, trex: buildTrex, trice: buildTrice, brachio: buildBrachio, compy: buildCompy };
