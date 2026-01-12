import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

// =========================================================
// 1. SHADERS (VISUAL STYLE)
// =========================================================

const gridVertex = `
  varying vec3 vWorldPos;
  void main() {
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const gridFragment = `
  varying vec3 vWorldPos;
  uniform float uTime;
  uniform vec3 uColor;
  void main() {
    float size = 2.0; float speed = 0.5; float zMove = vWorldPos.z + uTime * speed;
    float lineX = step(0.98, fract(vWorldPos.x / size));
    float lineZ = step(0.98, fract(zMove / size));
    float grid = max(lineX, lineZ);
    float dist = length(vWorldPos.xz);
    float alpha = (1.0 - smoothstep(5.0, 30.0, dist)) * grid * 0.4;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const toonVertex = `
  varying vec3 vNormal; varying vec3 vViewDir; varying vec2 vUv; varying vec3 vPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    vUv = uv; vPos = position;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const toonFragment = `
  uniform vec3 uColor; uniform vec3 uRimColor; uniform vec3 uEmissive; uniform vec3 uLightDir;
  uniform int uMatType; uniform float uTime;
  varying vec3 vNormal; varying vec3 vViewDir; varying vec2 vUv; varying vec3 vPos;

  void main() {
    vec3 normal = normalize(vNormal); vec3 viewDir = normalize(vViewDir); vec3 lightDir = normalize(uLightDir);

    vec3 albedo = uColor;
    float glossiness = 1.0;

    if (uMatType == 2) {
       float split = smoothstep(-0.01, 0.01, vPos.y - 0.12);
       albedo = mix(uColor, vec3(0.96, 0.96, 0.98), split);
       glossiness = 3.0;
    }

    float NdotL = dot(normal, lightDir);
    float diffuseTerm = (NdotL * 0.5) + 0.5;
    float lightIntensity = smoothstep(0.3, 0.35, diffuseTerm) * 0.3 + smoothstep(0.6, 0.8, diffuseTerm) * 0.7;

    float upDot = dot(normal, vec3(0.0, 1.0, 0.0));
    vec3 ambient = albedo * 0.4 * (upDot * 0.5 + 0.5);
    vec3 diffuse = albedo * lightIntensity * 1.0;

    vec3 halfVector = normalize(lightDir + viewDir);
    float NdotH = dot(normal, halfVector);
    float specSize = (1.0 - glossiness * 0.1) * 0.05 + 0.95;
    float specular = smoothstep(specSize, specSize + 0.01, NdotH);
    vec3 specColor = vec3(1.0) * specular * (1.0 - 0.5) * glossiness * 0.5;

    float NdotV = 1.0 - dot(normal, viewDir);
    float rimDot = smoothstep(0.5, 0.9, NdotV);
    float rimMask = smoothstep(-0.2, 0.1, NdotL);
    vec3 rim = uRimColor * rimDot * rimMask * 0.6;

    vec3 chartEmissive = vec3(0.0);
    if (uMatType == 2) {
      float grid = step(0.97, fract(vUv.x * 20.0)) * 0.05;
      chartEmissive += vec3(grid) * uRimColor;
    }

    if (uMatType == 2) {
       vec3 r = reflect(-viewDir, normal);
       float reflection = smoothstep(0.6, 0.9, r.y) * 0.2;
       diffuse += reflection;
    }

    vec3 finalColor = ambient + diffuse + specular + rim + uEmissive + chartEmissive;
    if (length(uEmissive) < 0.1) finalColor = min(finalColor, vec3(0.95));

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const outlineVertex = `
  uniform float uThickness;
  void main() {
    vec3 newPos = position + normal * uThickness;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
  }
`;
const outlineFragment = `
  uniform vec3 uColor; void main() { gl_FragColor = vec4(uColor, 1.0); }
`;

const CinematicShader = {
  uniforms: { "tDiffuse": { value: null }, "uTime": { value: 0 }, "uIntensity": { value: 0.0015 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uIntensity; varying vec2 vUv;
    float random(vec2 p) { return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 dist = vUv - 0.5; vec2 offset = dist * uIntensity;
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      vec3 color = vec3(r, g, b);
      float len = length(dist);
      color *= smoothstep(0.8, 0.25, len);
      color += random(vUv * uTime) * 0.03;
      gl_FragColor = vec4(color, 1.0);
    }
  `
};

// =========================================================
// 2. HELPER FOR RENDERING
// =========================================================

export function setupComposer(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
  bloomPass.threshold = 0.9;
  bloomPass.strength = 0.5;
  bloomPass.radius = 0.6;
  composer.addPass(bloomPass);

  const cinematic = new ShaderPass(CinematicShader);
  cinematic.uniforms['tDiffuse'].value = null;
  composer.addPass(cinematic);

  const fxaa = new ShaderPass(FXAAShader);
  const pixelRatio = renderer.getPixelRatio();
  fxaa.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
  fxaa.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
  composer.addPass(fxaa);

  composer.addPass(new OutputPass());

  return { composer, cinematicUniforms: cinematic.uniforms };
}

// =========================================================
// 3. PHYSICS ENGINE
// =========================================================

class Spring {
  target = 0;
  position = 0;
  velocity = 0;
  stiffness: number;
  damping: number;
  mass: number;

  constructor(stiffness = 150, damping = 15, mass = 1) {
    this.stiffness = stiffness;
    this.damping = damping;
    this.mass = mass;
  }

  update(dt: number) {
    const force = (this.target - this.position) * this.stiffness;
    const acceleration = force / this.mass;
    this.velocity = (this.velocity + acceleration * dt) * (1 - this.damping * dt);
    this.position += this.velocity * dt;
  }
}

// =========================================================
// 4. PET SYSTEM
// =========================================================

export const PET_TYPES = { FOFO: 'FOFO', CAOS: 'CAOS', CHAD: 'CHAD', DEGEN: 'DEGEN' } as const;
export type PetType = keyof typeof PET_TYPES;

const BG_COLORS: Record<PetType, number> = {
  FOFO: 0x221115,
  CAOS: 0x10051a,
  CHAD: 0x1a1a1a,
  DEGEN: 0x010401
};

interface PetConfig {
  eyeY: number;
  eyeZ: number;
  eyeScale?: number;
  eyeSep?: number;
  degen?: boolean;
  mouthColor?: number;
  hiddenEyes?: boolean;
  asymmetric?: boolean;
  relativeToGroup?: boolean;
}

interface Particle {
  m: THREE.Mesh;
  life: number;
  v: THREE.Vector3;
  t?: string;
}

class PetBuilder {
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createMaterial(color: number, rim: number, emissive = 0x000000, type = 0) {
    return new THREE.ShaderMaterial({
      vertexShader: toonVertex,
      fragmentShader: toonFragment,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uRimColor: { value: new THREE.Color(rim) },
        uEmissive: { value: new THREE.Color(emissive) },
        uLightDir: { value: new THREE.Vector3(0.5, 1, 1) },
        uMatType: { value: type },
        uTime: { value: 0 }
      }
    });
  }

  createMesh(geo: THREE.BufferGeometry, color: number, rim: number, outColor: number, outThick = 0.025, emissive = 0x000000, type = 0) {
    const mat = this.createMaterial(color, rim, emissive, type);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const matOut = new THREE.ShaderMaterial({
      vertexShader: outlineVertex,
      fragmentShader: outlineFragment,
      uniforms: {
        uColor: { value: new THREE.Color(outColor) },
        uThickness: { value: outThick }
      },
      side: THREE.BackSide
    });
    const outline = new THREE.Mesh(geo, matOut);
    outline.userData.isOutline = true;
    mesh.add(outline);
    return mesh;
  }

  buildCRINGE(root: THREE.Group): PetConfig {
    const group = new THREE.Group();
    group.position.y = 0.6;
    const pillGreen = 0x8b5cf6;
    const bodyRim = 0xffffff;
    const bodyOut = 0x4c1d95;

    const bodyGeo = new THREE.CapsuleGeometry(0.42, 0.75, 8, 32);
    const body = this.createMesh(bodyGeo, pillGreen, bodyRim, bodyOut, 0.025, 0x000000, 2);
    group.add(body);

    const termGroup = new THREE.Group();
    termGroup.position.set(0, -0.1, 0.42);
    termGroup.rotation.x = -0.15;
    const term = this.createMesh(new THREE.BoxGeometry(0.25, 0.18, 0.04), 0x111111, 0xffffff, 0x000000, 0.01);
    termGroup.add(term);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.12),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0x8b5cf6).multiplyScalar(3.0) })
    );
    screen.position.z = 0.025;
    termGroup.add(screen);
    group.add(termGroup);

    const cCount = 12;
    const cGeo = new THREE.BoxGeometry(0.08, 0.25, 0.02);
    const wGeo = new THREE.BoxGeometry(0.01, 0.4, 0.01);
    const candles = new THREE.InstancedMesh(cGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), cCount);
    const wicks = new THREE.InstancedMesh(wGeo, new THREE.MeshBasicMaterial({ color: 0x888888 }), cCount);
    const dummy = new THREE.Object3D();
    const radius = 0.9;

    for (let i = 0; i < cCount; i++) {
      const a = (i / cCount) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * radius, (Math.random() - 0.5) * 0.3, Math.sin(a) * radius);
      dummy.rotation.y = -a;
      dummy.updateMatrix();
      candles.setMatrixAt(i, dummy.matrix);
      wicks.setMatrixAt(i, dummy.matrix);
      const isUp = Math.random() > 0.4;
      candles.setColorAt(i, new THREE.Color(isUp ? 0x8b5cf6 : 0xff0044).multiplyScalar(2.0));
    }

    const ring = new THREE.Group();
    ring.add(candles, wicks);
    ring.userData.isCandleRing = true;
    group.add(ring);
    root.add(group);

    return { eyeY: 0.95, eyeZ: 0.45, eyeScale: 0.8, eyeSep: 0.18, degen: true, mouthColor: 0x4c1d95 };
  }

  buildFOFO(root: THREE.Group): PetConfig {
    const pink = 0xffb7c5;
    const bodyGeo = new THREE.SphereGeometry(0.8, 32, 32);
    bodyGeo.scale(1, 0.85, 1);
    const body = this.createMesh(bodyGeo, pink, 0xffffff, 0xdbaec0);
    body.position.y = 0.7;
    root.add(body);

    const earL = this.createMesh(new THREE.SphereGeometry(0.25, 16, 16), pink, 0xffffff, 0xdbaec0);
    earL.position.set(-0.5, 1.3, 0);
    const earR = earL.clone();
    earR.position.set(0.5, 1.3, 0);
    root.add(earL, earR);

    return { eyeY: 0.7, eyeZ: 0.75, eyeScale: 1.0, eyeSep: 0.3, mouthColor: 0xcc8899 };
  }

  buildCHAD(root: THREE.Group): PetConfig {
    const col = 0x757575;
    const rim = 0xaaaaaa;
    const out = 0x222222;
    const grp = new THREE.Group();

    grp.add(this.createMesh(new THREE.BoxGeometry(1, 1.6, 0.9).translate(0, 0.8, 0), col, rim, out));
    grp.add(this.createMesh(new THREE.BoxGeometry(1.05, 0.3, 0.4).translate(0, 1.4, 0.4), col, rim, out));
    grp.add(this.createMesh(new THREE.BoxGeometry(0.35, 0.9, 0.3).translate(0, 0.8, 0.55), col, rim, out));
    grp.add(this.createMesh(new THREE.BoxGeometry(0.9, 0.5, 0.3).translate(0, 0.25, 0.45), col, rim, out));
    grp.add(this.createMesh(new THREE.BoxGeometry(1.1, 0.15, 0.1).translate(0, 1.05, 0.55), 0x111111, 0xffffff, 0x000000));

    root.add(grp);
    return { hiddenEyes: true, eyeY: 0.8, eyeZ: 0.55, mouthColor: 0x333333 };
  }

  buildCAOS(root: THREE.Group): PetConfig {
    const geo = new THREE.IcosahedronGeometry(0.7, 4);
    const count = geo.attributes.position.count;
    const basePos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      basePos[i * 3] = geo.attributes.position.getX(i);
      basePos[i * 3 + 1] = geo.attributes.position.getY(i);
      basePos[i * 3 + 2] = geo.attributes.position.getZ(i);
    }
    geo.userData.basePos = basePos;

    const body = this.createMesh(geo, 0x440066, 0x00ff00, 0x220033, 0.03, 0x050011);
    body.position.y = 0.7;
    body.userData.isChaosBody = true;
    root.add(body);

    const shard = this.createMesh(new THREE.ConeGeometry(0.1, 0.8, 4), 0x6600cc, 0x00ff00, 0x220033);
    shard.position.set(0.5, 1.2, 0);
    shard.rotation.z = -0.5;
    root.add(shard);

    const crack = new THREE.Mesh(
      new THREE.TorusGeometry(0.65, 0.03, 4, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    crack.position.y = 0.7;
    crack.rotation.x = 1.57;
    crack.scale.setScalar(1.05);
    root.add(crack);

    return { eyeY: 0.7, eyeZ: 0.65, eyeScale: 1.0, eyeSep: 0.25, asymmetric: true, mouthColor: 0xccff00 };
  }

  buildFood(root: THREE.Group): THREE.Group {
    const g = new THREE.Group();
    const m = this.createMesh(
      new THREE.CylinderGeometry(0.2, 0.15, 0.6, 16).rotateZ(1.57),
      0x8B4513, 0xffaa00, 0x331100
    );
    const b1 = this.createMesh(new THREE.SphereGeometry(0.18).translate(-0.35, 0, 0), 0xeeeeee, 0xffffff, 0xaaaaaa);
    const b2 = this.createMesh(new THREE.SphereGeometry(0.18).translate(0.35, 0, 0), 0xeeeeee, 0xffffff, 0xaaaaaa);
    g.add(m, b1, b2);
    root.add(g);
    return g;
  }

  buildMouth(root: THREE.Group, y: number, z: number, color: number): THREE.Mesh {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.035, 8, 16, 3.14),
      this.createMaterial(color, 0xffffff)
    );
    m.position.set(0, y - 0.25, z + 0.12);
    m.rotation.z = 3.14;
    m.userData.isMouth = true;
    m.userData.baseY = y - 0.25;
    root.add(m);
    return m;
  }

  buildEyes(root: THREE.Group, cfg: PetConfig): { l: THREE.Group; r: THREE.Group } {
    const grp = new THREE.Group();
    const scleraMat = this.createMaterial(cfg.degen ? 0xffaaaa : 0xffffff, 0xffffff);
    const irisMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(cfg.degen ? 0x8b5cf6 : (cfg.asymmetric ? 0xff00ff : 0x4a9eff)).multiplyScalar(1.5)
    });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const lidMat = this.createMaterial(cfg.degen ? 0xffffff : 0x222222, 0xaaaaaa);

    const makeEye = (s: number): THREE.Group => {
      const u = new THREE.Group();
      const sc = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 24), scleraMat);
      sc.scale.set(1, 1, 0.6);
      u.add(sc);

      const ir = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), irisMat);
      ir.scale.set(0.7, 0.7, 0.7);
      ir.position.z = 0.035;
      u.add(ir);

      const pu = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), pupilMat);
      if (!cfg.degen) pu.scale.set(0.35, 0.35, 0.8);
      else pu.scale.set(0.25, 0.25, 0.8);
      pu.position.z = 0.08;
      u.add(pu);

      const hi = new THREE.Mesh(
        new THREE.PlaneGeometry(0.05, 0.05),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      hi.position.set(0.05, 0.05, 0.12);
      u.add(hi);

      const lid = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.5),
        lidMat
      );
      lid.rotation.x = -0.5;
      lid.scale.setScalar(1.1);
      lid.userData.isEyelid = true;
      u.add(lid);

      if (cfg.degen) {
        const bag = new THREE.Mesh(
          new THREE.TorusGeometry(0.12, 0.02, 4, 16, 3.14),
          new THREE.MeshBasicMaterial({ color: 0xaa0000, transparent: true, opacity: 0.15 })
        );
        bag.position.set(0, -0.02, 0.05);
        bag.rotation.z = 3.14;
        u.add(bag);
      }

      u.scale.setScalar(s);
      return u;
    };

    const l = makeEye(cfg.eyeScale || 1);
    const r = makeEye(cfg.eyeScale || 1);
    const yOff = cfg.relativeToGroup ? 0.7 : 0;
    l.position.set(-(cfg.eyeSep || 0.3), cfg.eyeY + yOff, cfg.eyeZ);
    r.position.set(cfg.eyeSep || 0.3, cfg.eyeY + yOff, cfg.eyeZ);

    if (cfg.asymmetric) {
      r.scale.setScalar(1.5);
      l.position.y -= 0.1;
    }

    grp.add(l, r);
    root.add(grp);
    return { l, r };
  }
}

export type PetState = 'idle' | 'happy' | 'eat' | 'sleep';

export class PetSystem {
  scene: THREE.Scene;
  camera: THREE.Camera;
  root: THREE.Group;
  light: THREE.DirectionalLight;
  builder: PetBuilder;
  state: PetState = 'idle';
  time = 0;
  stateTimer = 0;
  particles: Particle[] = [];
  eyes: { l: THREE.Group; r: THREE.Group } | null = null;
  mouth: THREE.Mesh | null = null;
  mouseTarget = new THREE.Vector2();
  springX: Spring;
  springY: Spring;
  floor: THREE.Mesh;
  type: PetType = 'FOFO';
  animRoot: THREE.Group | null = null;
  food: THREE.Group | null = null;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
    this.root = new THREE.Group();
    scene.add(this.root);

    this.light = new THREE.DirectionalLight(0xffffff, 1.5);
    this.light.position.set(5, 8, 5);
    this.root.add(this.light);
    this.root.add(new THREE.HemisphereLight(0x445566, 0x111122, 1.5));

    this.builder = new PetBuilder(scene);
    this.springX = new Spring(120, 10);
    this.springY = new Spring(120, 10);

    const gridMat = new THREE.ShaderMaterial({
      vertexShader: gridVertex,
      fragmentShader: gridFragment,
      transparent: true,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0x45a29e) } }
    });
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40, 40, 40), gridMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.root.add(this.floor);

    this.setType('FOFO');
  }

  setType(type: PetType) {
    this.type = type;
    this.scene.background = new THREE.Color(BG_COLORS[type]);

    for (let i = this.root.children.length - 1; i >= 0; i--) {
      const child = this.root.children[i];
      if (child !== this.floor && child.type === 'Group') {
        this.root.remove(child);
      }
    }

    this.animRoot = new THREE.Group();
    this.root.add(this.animRoot);
    this.eyes = null;
    this.mouth = null;

    let cfg: PetConfig;
    if (type === 'FOFO') cfg = this.builder.buildFOFO(this.animRoot);
    else if (type === 'CAOS') cfg = this.builder.buildCAOS(this.animRoot);
    else if (type === 'CHAD') cfg = this.builder.buildCHAD(this.animRoot);
    else cfg = this.builder.buildCRINGE(this.animRoot);

    if (!cfg.hiddenEyes) this.eyes = this.builder.buildEyes(this.animRoot, cfg);
    if (cfg.mouthColor) this.mouth = this.builder.buildMouth(this.animRoot, cfg.eyeY + (cfg.relativeToGroup ? 0.7 : 0), cfg.eyeZ, cfg.mouthColor);
    this.food = this.builder.buildFood(this.root);
    this.food.visible = false;

    const c = type === 'DEGEN' ? 0x8b5cf6 : (type === 'CAOS' ? 0x8a2be2 : (type === 'FOFO' ? 0xff66aa : 0xaaaaaa));
    (this.floor.material as THREE.ShaderMaterial).uniforms.uColor.value.setHex(c);
  }

  setState(s: PetState) {
    this.state = s;
    this.stateTimer = 0;
  }

  pet() {
    this.setState('happy');
    this.spawnVFX('spark');
  }

  feed() {
    this.setState('eat');
  }

  sleep() {
    this.setState('sleep');
  }

  wake() {
    this.setState('idle');
  }

  setMouseTarget(x: number, y: number) {
    this.mouseTarget.set(x, y);
  }

  update(dt: number) {
    this.time += dt;
    this.stateTimer += dt;
    (this.floor.material as THREE.ShaderMaterial).uniforms.uTime.value = this.time;

    if ((this.state === 'eat' && this.stateTimer > 4.0) || (this.state === 'happy' && this.stateTimer > 2.0)) {
      this.setState('idle');
    }

    this.springX.target = this.mouseTarget.x;
    this.springY.target = this.mouseTarget.y;
    this.springX.update(dt);
    this.springY.update(dt);

    this.root.traverse((o) => {
      if ((o as THREE.Mesh).material && ((o as THREE.Mesh).material as THREE.ShaderMaterial).uniforms) {
        const uniforms = ((o as THREE.Mesh).material as THREE.ShaderMaterial).uniforms;
        if (uniforms.uTime) uniforms.uTime.value = this.time;
        if (uniforms.uLightDir) uniforms.uLightDir.value.copy(new THREE.Vector3(0.5, 1, 1).normalize());
      }
    });

    if (this.type === 'DEGEN') this.updateDegenAnim();
    if (this.type === 'CAOS') this.updateChaosDeform();
    this.updateStateAnim(dt);
    this.updateEyeLogic();
    this.updateMouth();
    this.updateVFX(dt);

    if (this.food) {
      if (this.state === 'eat') {
        this.food.visible = true;
        this.food.position.set(0, 0.4 + Math.sin(this.time * 5) * 0.05, 0.8);
        this.food.rotation.y += dt;
        this.food.rotation.z = Math.sin(this.time * 10) * 0.1;
        const remaining = Math.max(0, 1.0 - (this.stateTimer / 3.5));
        this.food.scale.setScalar(remaining);
        if (Math.random() < 0.1 && remaining > 0.1) this.spawnVFX('crumb', this.food.position);
      } else {
        this.food.visible = false;
        this.food.scale.setScalar(1.0);
      }
    }
  }

  updateDegenAnim() {
    this.animRoot?.traverse((c) => {
      if (c.userData.isCandleRing) c.rotation.y += 0.008;
    });
    if (this.state === 'idle' && this.animRoot) {
      this.animRoot.position.y = Math.sin(this.time * 4) * 0.03;
    }
  }

  updateChaosDeform() {
    if (!this.animRoot) return;

    const bodies: THREE.Mesh[] = [];
    this.animRoot.traverse((c) => {
      if (c.userData.isChaosBody && c instanceof THREE.Mesh) {
        bodies.push(c);
      }
    });

    if (bodies.length === 0) return;
    const body = bodies[0];

    const geometry = body.geometry as THREE.BufferGeometry;
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const base = geometry.userData.basePos as Float32Array;
    if (!base) return;

    for (let i = 0; i < pos.count; i++) {
      const bx = base[i * 3], by = base[i * 3 + 1], bz = base[i * 3 + 2];
      const noise = Math.sin(this.time * 3 + bx * 4) * 0.06;
      const nx = bx / 0.7, ny = by / 0.7, nz = bz / 0.7;
      pos.setXYZ(i, bx + nx * noise, by + ny * noise, bz + nz * noise);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  updateStateAnim(dt: number) {
    if (!this.animRoot) return;

    const targetPos = new THREE.Vector3(0, 0, 0);
    const targetRot = new THREE.Euler(0, 0, 0);
    const targetScale = new THREE.Vector3(1, 1, 1);

    if (this.state !== 'sleep') {
      targetRot.y = this.springX.position * 0.3;
      targetRot.x = this.springY.position * 0.2;
    }

    if (this.state === 'happy') {
      const t = this.stateTimer * 8;
      const jump = Math.abs(Math.sin(t));
      targetPos.y = jump * 0.5;
      const velocity = Math.cos(t);
      if (velocity > 0) {
        targetScale.y = 1.0 + velocity * 0.2;
        targetScale.x = targetScale.z = 1.0 - velocity * 0.1;
      } else {
        targetScale.y = 1.0 + velocity * 0.1;
        targetScale.x = targetScale.z = 1.0 - velocity * 0.05;
      }
    } else if (this.state === 'eat') {
      targetRot.x += 0.4 + Math.sin(this.time * 20) * 0.1;
      targetPos.z += 0.2;
    } else if (this.state === 'sleep') {
      targetRot.z = -1.57;
      targetPos.y = -0.2;
      const breath = Math.sin(this.time) * 0.03;
      targetScale.set(1 + breath, 1 - breath, 1 + breath);
    } else if (this.state === 'idle') {
      const breath = Math.sin(this.time * 3) * 0.02;
      targetPos.y = breath;
    }

    const lerpSpeed = dt * 8;
    if (this.type !== 'DEGEN' || this.state !== 'idle') {
      this.animRoot.position.lerp(targetPos, lerpSpeed);
    }
    this.animRoot.scale.lerp(targetScale, lerpSpeed);
    this.animRoot.rotation.x = THREE.MathUtils.lerp(this.animRoot.rotation.x, targetRot.x, lerpSpeed);
    this.animRoot.rotation.y = THREE.MathUtils.lerp(this.animRoot.rotation.y, targetRot.y, lerpSpeed);
    this.animRoot.rotation.z = THREE.MathUtils.lerp(this.animRoot.rotation.z, targetRot.z, lerpSpeed);
  }

  updateEyeLogic() {
    if (!this.eyes) return;

    let blink = 0;
    if (this.state === 'sleep') {
      blink = 1;
      if (Math.random() < 0.02) this.spawnVFX('zzz');
    } else if (Math.random() < 0.01) {
      blink = 1;
    }

    [this.eyes.l, this.eyes.r].forEach((eye) => {
      const lid = eye.children.find((c) => c.userData.isEyelid) as THREE.Mesh | undefined;
      if (lid) {
        const startRot = -0.5;
        const endRot = Math.PI / 2;
        const target = THREE.MathUtils.lerp(startRot, endRot, blink);
        lid.rotation.x = THREE.MathUtils.lerp(lid.rotation.x, target, 0.4);
      }
    });
  }

  updateMouth() {
    if (!this.mouth) return;

    let rZ = 3.14;
    let sY = 1;
    let yOff = 0;

    if (this.state === 'eat') {
      sY = 0.2 + Math.abs(Math.sin(this.time * 20));
    } else if (this.state === 'sleep' || (this.state === 'idle' && (this.type === 'CAOS' || this.type === 'DEGEN'))) {
      rZ = 0;
      yOff = -0.05;
    } else if (this.state === 'happy') {
      sY = 1.3;
    }

    this.mouth.rotation.z = rZ;
    this.mouth.scale.y = THREE.MathUtils.lerp(this.mouth.scale.y, sY, 0.2);
    this.mouth.position.y = this.mouth.userData.baseY + yOff;
  }

  spawnVFX(type: string, pos?: THREE.Vector3) {
    const p = pos ? pos.clone() : (this.animRoot?.position.clone() || new THREE.Vector3()).add(new THREE.Vector3(0, 1, 0));

    if (type === 'spark') {
      const m = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.1),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
      );
      m.position.copy(p);
      this.root.add(m);
      this.particles.push({ m, life: 1, v: new THREE.Vector3(0, 1.5, 0) });
    } else if (type === 'zzz') {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 40px Arial';
        ctx.fillText('Z', 20, 50);
      }
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.3),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, side: THREE.DoubleSide })
      );
      m.position.copy(this.animRoot?.position || new THREE.Vector3()).add(new THREE.Vector3(0.5, 0.5, 0));
      this.root.add(m);
      this.particles.push({ m, life: 2, v: new THREE.Vector3(0.2, 0.5, 0), t: 'z' });
    } else if (type === 'crumb') {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.05, 0.05),
        new THREE.MeshBasicMaterial({ color: 0x8B4513 })
      );
      m.position.copy(p);
      m.position.x += (Math.random() - 0.5) * 0.2;
      this.root.add(m);
      this.particles.push({
        m,
        life: 1,
        v: new THREE.Vector3((Math.random() - 0.5) * 0.5, -1, (Math.random() - 0.5) * 0.5),
        t: 'c'
      });
    }
  }

  updateVFX(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.m.position.addScaledVector(p.v, dt);

      if (p.t === 'z') {
        if (this.camera) p.m.lookAt(this.camera.position);
        (p.m.material as THREE.MeshBasicMaterial).opacity = p.life / 2;
      } else if (p.t === 'c') {
        p.m.rotation.x += dt * 5;
        if (p.m.position.y < 0) p.life = 0;
      } else {
        p.m.rotation.y += dt * 5;
        p.m.scale.setScalar(p.life);
      }

      if (p.life <= 0) {
        this.root.remove(p.m);
        this.particles.splice(i, 1);
      }
    }
  }

  dispose() {
    this.root.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      if ((obj as THREE.Mesh).material) {
        const material = (obj as THREE.Mesh).material;
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose());
        } else {
          material.dispose();
        }
      }
    });
    this.scene.remove(this.root);
  }
}
