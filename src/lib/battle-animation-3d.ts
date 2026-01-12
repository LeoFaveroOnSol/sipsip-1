/**
 * 3D Battle Animation System
 * Extends the existing PetSystem for battle animations
 */

import * as THREE from 'three';
import { BattleReplayFrame } from './battle-logic';

// ============== TYPES ==============

export interface BattleAnimationConfig {
  battleDuration: number;      // Total battle duration in seconds
  attackDuration: number;      // Duration of attack animation
  hitReactionDuration: number; // Duration of hit reaction
  victoryDuration: number;     // Duration of victory animation
  defeatDuration: number;      // Duration of defeat animation
}

export interface BattleParticipant {
  id: string;
  name: string;
  tribe: string;
  power: number;
  position: THREE.Vector3;
  rotation: THREE.Euler;
}

export type BattleAnimationState =
  | 'idle'
  | 'ready'
  | 'attacking'
  | 'defending'
  | 'hit'
  | 'dodging'
  | 'victory'
  | 'defeat';

// ============== CONFIGURATION ==============

export const BATTLE_ANIMATION_CONFIG: BattleAnimationConfig = {
  battleDuration: 30,
  attackDuration: 0.5,
  hitReactionDuration: 0.3,
  victoryDuration: 2,
  defeatDuration: 1.5,
};

// Arena positions
export const ARENA_POSITIONS = {
  challenger: new THREE.Vector3(-2, 0, 0),
  defender: new THREE.Vector3(2, 0, 0),
  camera: new THREE.Vector3(0, 3, 6),
  cameraLookAt: new THREE.Vector3(0, 0.5, 0),
};

// ============== BATTLE ANIMATOR CLASS ==============

/**
 * Controls battle animations between two pets
 */
export class BattleAnimator {
  private scene: THREE.Scene;
  private clock: THREE.Clock;
  private isPlaying: boolean = false;
  private currentFrame: number = 0;
  private replayData: BattleReplayFrame[] = [];
  private animationCallbacks: Map<string, () => void> = new Map();

  // Pet references (to be connected to PetSystem instances)
  private challengerState: BattleAnimationState = 'idle';
  private defenderState: BattleAnimationState = 'idle';

  // Health tracking
  private challengerHp: number = 100;
  private defenderHp: number = 100;

  // Event callbacks
  public onStateChange?: (pet: 'challenger' | 'defender', state: BattleAnimationState) => void;
  public onDamage?: (pet: 'challenger' | 'defender', damage: number, remainingHp: number) => void;
  public onBattleEnd?: (winner: 'challenger' | 'defender') => void;
  public onFrameUpdate?: (frame: BattleReplayFrame) => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.clock = new THREE.Clock();
  }

  /**
   * Load replay data for playback
   */
  loadReplay(replayData: BattleReplayFrame[]): void {
    this.replayData = replayData;
    this.currentFrame = 0;
    this.challengerHp = 100;
    this.defenderHp = 100;
    this.challengerState = 'ready';
    this.defenderState = 'ready';
  }

  /**
   * Start playing the battle animation
   */
  async playReplay(): Promise<void> {
    if (this.replayData.length === 0) {
      console.warn('No replay data loaded');
      return;
    }

    this.isPlaying = true;
    this.clock.start();

    // Play through each frame
    for (let i = 0; i < this.replayData.length; i++) {
      if (!this.isPlaying) break;

      this.currentFrame = i;
      const frame = this.replayData[i];

      // Wait until frame timestamp
      if (i > 0) {
        const prevFrame = this.replayData[i - 1];
        const waitTime = (frame.timestamp - prevFrame.timestamp) * 1000;
        await this.delay(waitTime);
      }

      // Process frame
      await this.processFrame(frame);
    }

    // Determine winner and play end animation
    const lastFrame = this.replayData[this.replayData.length - 1];
    const challengerWins = (lastFrame.remainingHp?.challenger || 0) > 0;

    await this.playEndAnimation(challengerWins ? 'challenger' : 'defender');

    this.isPlaying = false;
  }

  /**
   * Process a single battle frame
   */
  private async processFrame(frame: BattleReplayFrame): Promise<void> {
    // Update HP
    if (frame.remainingHp) {
      this.challengerHp = frame.remainingHp.challenger;
      this.defenderHp = frame.remainingHp.defender;
    }

    // Notify frame update
    this.onFrameUpdate?.(frame);

    // Process action based on type
    switch (frame.action) {
      case 'attack':
      case 'special':
      case 'critical':
        await this.playAttack(frame.attackerId, frame.action);
        break;

      case 'hit':
        const target = frame.attackerId;
        await this.playHit(target, frame.damage || 0);
        this.onDamage?.(
          target,
          frame.damage || 0,
          target === 'challenger' ? this.challengerHp : this.defenderHp
        );
        break;

      case 'dodge':
        const dodger = frame.attackerId === 'challenger' ? 'defender' : 'challenger';
        await this.playDodge(dodger);
        break;

      case 'defend':
        await this.playDefend(frame.attackerId);
        break;
    }
  }

  /**
   * Play attack animation
   */
  async playAttack(
    attacker: 'challenger' | 'defender',
    type: 'attack' | 'special' | 'critical' = 'attack'
  ): Promise<void> {
    this.setState(attacker, 'attacking');

    // Attack motion parameters based on type
    const intensity = type === 'critical' ? 1.5 : type === 'special' ? 1.25 : 1;

    // Animation would be handled by PetSystem
    // Here we just manage state timing
    await this.delay(BATTLE_ANIMATION_CONFIG.attackDuration * 1000);

    this.setState(attacker, 'idle');
  }

  /**
   * Play hit reaction animation
   */
  async playHit(target: 'challenger' | 'defender', damage: number): Promise<void> {
    this.setState(target, 'hit');

    // Spawn hit effect
    this.spawnHitEffect(target, damage);

    await this.delay(BATTLE_ANIMATION_CONFIG.hitReactionDuration * 1000);

    this.setState(target, 'idle');
  }

  /**
   * Play dodge animation
   */
  async playDodge(pet: 'challenger' | 'defender'): Promise<void> {
    this.setState(pet, 'dodging');

    await this.delay(BATTLE_ANIMATION_CONFIG.hitReactionDuration * 1000);

    this.setState(pet, 'idle');
  }

  /**
   * Play defend animation
   */
  async playDefend(pet: 'challenger' | 'defender'): Promise<void> {
    this.setState(pet, 'defending');

    await this.delay(BATTLE_ANIMATION_CONFIG.attackDuration * 1000);

    this.setState(pet, 'idle');
  }

  /**
   * Play end animation (victory/defeat)
   */
  async playEndAnimation(winner: 'challenger' | 'defender'): Promise<void> {
    const loser = winner === 'challenger' ? 'defender' : 'challenger';

    this.setState(winner, 'victory');
    this.setState(loser, 'defeat');

    this.onBattleEnd?.(winner);

    await this.delay(BATTLE_ANIMATION_CONFIG.victoryDuration * 1000);
  }

  /**
   * Set animation state and notify
   */
  private setState(pet: 'challenger' | 'defender', state: BattleAnimationState): void {
    if (pet === 'challenger') {
      this.challengerState = state;
    } else {
      this.defenderState = state;
    }
    this.onStateChange?.(pet, state);
  }

  /**
   * Spawn visual hit effect
   */
  private spawnHitEffect(target: 'challenger' | 'defender', damage: number): void {
    const position = target === 'challenger'
      ? ARENA_POSITIONS.challenger.clone()
      : ARENA_POSITIONS.defender.clone();

    position.y += 1; // Offset to pet height

    // Create damage number sprite
    this.createDamageNumber(position, damage);

    // Create impact particles
    this.createImpactParticles(position);
  }

  /**
   * Create floating damage number
   */
  private createDamageNumber(position: THREE.Vector3, damage: number): void {
    // In real implementation, this would create a sprite or DOM element
    // showing the damage number floating up and fading out
    console.log(`Damage: ${damage} at position`, position);
  }

  /**
   * Create impact particle effect
   */
  private createImpactParticles(position: THREE.Vector3): void {
    // In real implementation, this would create particle effects
    // using THREE.Points or a particle system
    console.log('Impact particles at', position);
  }

  /**
   * Stop playback
   */
  stop(): void {
    this.isPlaying = false;
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.stop();
    this.currentFrame = 0;
    this.challengerHp = 100;
    this.defenderHp = 100;
    this.challengerState = 'idle';
    this.defenderState = 'idle';
  }

  /**
   * Get current state
   */
  getState(): {
    isPlaying: boolean;
    currentFrame: number;
    totalFrames: number;
    challengerHp: number;
    defenderHp: number;
    challengerState: BattleAnimationState;
    defenderState: BattleAnimationState;
  } {
    return {
      isPlaying: this.isPlaying,
      currentFrame: this.currentFrame,
      totalFrames: this.replayData.length,
      challengerHp: this.challengerHp,
      defenderHp: this.defenderHp,
      challengerState: this.challengerState,
      defenderState: this.defenderState,
    };
  }

  /**
   * Utility: delay for async animations
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.stop();
    this.replayData = [];
    this.animationCallbacks.clear();
  }
}

// ============== BATTLE ARENA SETUP ==============

/**
 * Set up a battle arena scene
 */
export function setupBattleArena(scene: THREE.Scene): {
  floor: THREE.Mesh;
  lights: THREE.Light[];
} {
  // Create arena floor
  const floorGeometry = new THREE.CircleGeometry(5, 32);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.8,
    metalness: 0.2,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Add arena ring
  const ringGeometry = new THREE.RingGeometry(4.8, 5, 64);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  scene.add(ring);

  // Lighting
  const lights: THREE.Light[] = [];

  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  lights.push(ambientLight);

  // Key light (main)
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
  keyLight.position.set(5, 10, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  scene.add(keyLight);
  lights.push(keyLight);

  // Fill light
  const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
  fillLight.position.set(-5, 5, -5);
  scene.add(fillLight);
  lights.push(fillLight);

  // Rim light
  const rimLight = new THREE.DirectionalLight(0xff8888, 0.2);
  rimLight.position.set(0, 5, -10);
  scene.add(rimLight);
  lights.push(rimLight);

  return { floor, lights };
}

/**
 * Create health bar 3D element
 */
export function createHealthBar(maxWidth: number = 2): THREE.Group {
  const group = new THREE.Group();

  // Background bar
  const bgGeometry = new THREE.PlaneGeometry(maxWidth, 0.2);
  const bgMaterial = new THREE.MeshBasicMaterial({
    color: 0x333333,
    side: THREE.DoubleSide,
  });
  const bgBar = new THREE.Mesh(bgGeometry, bgMaterial);
  group.add(bgBar);

  // Health bar (will be scaled)
  const hpGeometry = new THREE.PlaneGeometry(maxWidth - 0.05, 0.15);
  const hpMaterial = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    side: THREE.DoubleSide,
  });
  const hpBar = new THREE.Mesh(hpGeometry, hpMaterial);
  hpBar.position.z = 0.01;
  hpBar.name = 'healthFill';
  group.add(hpBar);

  return group;
}

/**
 * Update health bar fill
 */
export function updateHealthBar(
  healthBar: THREE.Group,
  currentHp: number,
  maxHp: number = 100
): void {
  const fill = healthBar.getObjectByName('healthFill') as THREE.Mesh;
  if (!fill) return;

  const percent = Math.max(0, Math.min(1, currentHp / maxHp));
  fill.scale.x = percent;
  fill.position.x = -(1 - percent) / 2;

  // Change color based on health
  const material = fill.material as THREE.MeshBasicMaterial;
  if (percent > 0.5) {
    material.color.setHex(0x22c55e); // Green
  } else if (percent > 0.25) {
    material.color.setHex(0xeab308); // Yellow
  } else {
    material.color.setHex(0xef4444); // Red
  }
}

// ============== BATTLE EFFECTS ==============

/**
 * Create attack trail effect
 */
export function createAttackTrail(
  scene: THREE.Scene,
  start: THREE.Vector3,
  end: THREE.Vector3,
  color: number = 0xffffff
): void {
  const points = [start, end];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.8,
  });
  const line = new THREE.Line(geometry, material);
  scene.add(line);

  // Fade out and remove
  const fadeOut = () => {
    material.opacity -= 0.05;
    if (material.opacity <= 0) {
      scene.remove(line);
      geometry.dispose();
      material.dispose();
    } else {
      requestAnimationFrame(fadeOut);
    }
  };

  setTimeout(fadeOut, 100);
}

/**
 * Create explosion effect for critical hits
 */
export function createExplosion(
  scene: THREE.Scene,
  position: THREE.Vector3,
  color: number = 0xff4444
): void {
  const particleCount = 20;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities: THREE.Vector3[] = [];

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = position.x;
    positions[i * 3 + 1] = position.y;
    positions[i * 3 + 2] = position.z;

    velocities.push(new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * 2,
      (Math.random() - 0.5) * 2
    ));
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color,
    size: 0.1,
    transparent: true,
    opacity: 1,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Animate particles
  let frame = 0;
  const maxFrames = 30;

  const animate = () => {
    frame++;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < particleCount; i++) {
      posAttr.array[i * 3] += velocities[i].x * 0.1;
      posAttr.array[i * 3 + 1] += velocities[i].y * 0.1;
      posAttr.array[i * 3 + 2] += velocities[i].z * 0.1;
      velocities[i].y -= 0.05; // Gravity
    }

    posAttr.needsUpdate = true;
    material.opacity = 1 - frame / maxFrames;

    if (frame < maxFrames) {
      requestAnimationFrame(animate);
    } else {
      scene.remove(particles);
      geometry.dispose();
      material.dispose();
    }
  };

  animate();
}
