/* Modelos 3D (glTF) compartidos: se cargan una vez y se clonan; funcionan sin internet porque se guardan con la app */
const MODELS = {};
function loadModels(names, base) {
  const loader = new THREE.GLTFLoader();
  let done = 0; const tick = () => { done++; window.LEON_PROGRESS = done / names.length; };
  return Promise.all(names.map(n => MODELS[n] ? (tick(), Promise.resolve()) : new Promise(res => {
    loader.load(base + n + '.glb', g => { tick();
      // Los juegos usan colores "tal cual" (sin conversión de color), así que las texturas también se leen tal cual,
      // y los materiales pasan a Lambert: luz suave, barata para el iPad y pareja con el resto del mundo
      g.scene.traverse(o => {
        if (!o.isMesh) return;
        o.castShadow = true; o.receiveShadow = true;
        // Pesos del esqueleto en decimales (vienen como enteros 0-255/65535 y Three r128 no los convierte al calcular poses a mano)
        const sw = o.geometry && o.geometry.attributes.skinWeight;
        if (sw && sw.normalized && !(sw.array instanceof Float32Array)) {
          const max = sw.array instanceof Uint8Array ? 255 : 65535, f = new Float32Array(sw.array.length);
          for (let i = 0; i < f.length; i++) f[i] = sw.array[i] / max;
          o.geometry.setAttribute('skinWeight', new THREE.BufferAttribute(f, sw.itemSize));
        }
        const conv = mt => { const l = new THREE.MeshLambertMaterial({ name: mt.name, color: mt.color.clone(), map: mt.map || null, skinning: !!o.isSkinnedMesh, vertexColors: mt.vertexColors }); if (l.map) l.map.encoding = THREE.LinearEncoding; return l; };
        o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
      });
      MODELS[n] = g; res();
    }, undefined, () => { tick(); console.warn('modelo no encontrado', n); res(); });
  })));
}
// Clona un modelo (con esqueleto si es animado) y lo escala para que su lado más largo mida `size`
function modelClone(name, size) {
  const src = MODELS[name]; if (!src) return new THREE.Group();
  const o = src.animations.length ? THREE.SkeletonUtils.clone(src.scene) : src.scene.clone(true);
  if (size) { const s = modelBox(o).getSize(new THREE.Vector3()); o.scale.multiplyScalar(size / Math.max(s.x, s.y, s.z)); }
  return o;
}
// Caja real del modelo: con esqueleto, la caja de la geometría no sirve (los huesos la reescalan), así que se mide con los huesos y los vértices deformados
function modelBox(o) {
  o.updateMatrixWorld(true);
  const box = new THREE.Box3(), v = new THREE.Vector3();
  let skinned = false;
  o.traverse(m => {
    if (!m.isSkinnedMesh) return; skinned = true;
    const p = m.geometry.attributes.position, step = Math.max(1, Math.floor(p.count / 300));
    for (let i = 0; i < p.count; i += step) { v.fromBufferAttribute(p, i); m.boneTransform(i, v); box.expandByPoint(v.applyMatrix4(m.matrixWorld)); }
  });
  return skinned ? box : box.setFromObject(o);
}
// Pinta los materiales de un clon: fn(nombreMaterial) devuelve un color (o null para dejarlo igual).
// Los materiales pintados se comparten entre clones para no crear cientos de copias.
const RECOLOR_CACHE = new Map();
function recolor(o, fn) {
  o.traverse(m => {
    if (!m.isMesh) return;
    const one = mt => {
      const col = fn(mt.name, mt); if (col == null) return mt;
      const key = mt.uuid + ':' + col;
      if (!RECOLOR_CACHE.has(key)) { const c = mt.clone(); c.color.setHex(col); RECOLOR_CACHE.set(key, c); }
      return RECOLOR_CACHE.get(key);
    };
    m.material = Array.isArray(m.material) ? m.material.map(one) : one(m.material);
  });
  return o;
}
