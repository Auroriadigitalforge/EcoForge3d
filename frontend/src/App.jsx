import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { deriveState, getPollutionLevel, applyActionDelta, computeQuizScore } from './utils/appLogic.js';

// ============================================================================
// 1. CONFIGURATION & STATE RULES (Carbon Calculator)
// ============================================================================
// Carbon_Score thresholds, pollution scaling, action deltas, and quiz scoring
// live in ./utils/appLogic.js so they can be unit-tested without React/WebGL.

const TRANSITION_MS = 900;
const DEFAULT_CAMERA_DISTANCE = 18;

const STATE_TRANSITION_MSG = {
  Polluted: '🏭 Your island has descended into a Polluted state. Log eco-actions to clean up the air!',
  Neutral:  '🌤️ Island reached Neutral! The smog is lifting, keep going!',
  Green:    '🌿 Welcome to a Green paradise! Clean energy and lush forests are thriving!',
};

// Preset habits and score increments
const ECO_HABITS = [
  { id: 'reusable', label: 'Used Reusable Containers', points: 5, category: 'waste', icon: '♻️' },
  { id: 'tree', label: 'Planted a Tree or Plant', points: 20, category: 'nature', icon: '🌱' },
  { id: 'bike', label: 'Rode a Bicycle/Walked', points: 10, category: 'transport', icon: '🚲' },
  { id: 'public_transport', label: 'Used Public Transport', points: 10, category: 'transport', icon: '🚌' },
  { id: 'led', label: 'Switched to LED Bulbs', points: 15, category: 'energy', icon: '💡' },
  { id: 'short_shower', label: 'Took a <5 Min Shower', points: 5, category: 'water', icon: '🚿' },
];

const SKY_COLORS = {
  Polluted: 0x0c131a,
  Neutral:  0x6da4c2,
  Green:    0x82ceeb,
};

const WATER_COLORS = {
  Polluted: 0x1f361c,
  Neutral:  0x397b9e,
  Green:    0x199ce0,
};

// ============================================================================
// 2. CACHED GEOMETRIES FOR PERFORMANCE (Prevent Memory Leaks on 4GB RAM)
// ============================================================================
const createGeometries = () => ({
  islandBody:   new THREE.CylinderGeometry(10.5, 8.2, 2.8, 8),
  islandTop:    new THREE.CylinderGeometry(10.1, 10.5, 0.45, 8),
  water:        new THREE.BoxGeometry(40, 0.3, 40),
  trunk:        new THREE.CylinderGeometry(0.12, 0.18, 1.4, 5),
  canopyLarge:  new THREE.SphereGeometry(0.75, 5, 4),
  canopyMed:    new THREE.SphereGeometry(0.55, 5, 4),
  houseBody:    new THREE.BoxGeometry(1.6, 1.4, 1.6),
  houseRoof:    new THREE.ConeGeometry(1.3, 1.0, 4),
  factoryBase:  new THREE.BoxGeometry(2.2, 2.6, 2.2),
  factoryStack: new THREE.CylinderGeometry(0.3, 0.38, 2.0, 6),
  smokeBox:     new THREE.BoxGeometry(0.3, 0.3, 0.3),
  turbineMast:  new THREE.CylinderGeometry(0.1, 0.16, 4.0, 5),
  turbineHub:   new THREE.SphereGeometry(0.2, 5, 4),
  turbineBlade: new THREE.BoxGeometry(0.1, 1.6, 0.05),
  solarFrame:   new THREE.BoxGeometry(1.2, 0.05, 0.8),
  solarPanel:   new THREE.BoxGeometry(1.1, 0.03, 0.7),
  solarLeg:     new THREE.CylinderGeometry(0.04, 0.04, 0.4, 4),
  bush:         new THREE.SphereGeometry(0.4, 4, 3),
  road:         new THREE.BoxGeometry(20, 0.08, 3.0),
  roadLine:     new THREE.BoxGeometry(18.0, 0.02, 0.08),
  wheel:        new THREE.CylinderGeometry(0.18, 0.18, 0.12, 8),
});

const GEO = createGeometries();

// Material shorthand
function mat(color) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}
function basicMat(color, options = {}) {
  return new THREE.MeshBasicMaterial({ color, flatShading: true, ...options });
}

// ============================================================================
// 3. LOW-POLY SCENE-BUILDING PRIMITIVES
// ============================================================================

function buildBareTree(x, z) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(GEO.trunk, mat(0x4a2e16));
  trunk.position.y = 0.7;
  g.add(trunk);

  [-0.25, 0.25].forEach((dx) => {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.06, 0.4, 4),
      mat(0x4a2e16)
    );
    branch.rotation.z = dx > 0 ? 0.5 : -0.5;
    branch.position.set(dx * 0.3, 1.1, 0);
    g.add(branch);
  });
  g.position.set(x, 0, z);
  return g;
}

// Fixed function variables
function buildGreenTree(x, z, scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(GEO.trunk, mat(0x5a3a1a));
  trunk.position.y = 0.7;
  g.add(trunk);

  const canopy = new THREE.Mesh(GEO.canopyLarge, mat(0x2a622c));
  canopy.position.y = 1.6;
  g.add(canopy);

  const canopyTop = new THREE.Mesh(GEO.canopyMed, mat(0x357a38));
  canopyTop.position.y = 2.2;
  g.add(canopyTop);

  g.scale.setScalar(scale);
  g.position.set(x, 0, z);
  return g;
}

function buildHouse(x, z) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(GEO.houseBody, mat(0xdfcaa0));
  body.position.y = 0.7;
  g.add(body);

  const roof = new THREE.Mesh(GEO.houseRoof, mat(0xa83c14));
  roof.position.y = 1.9;
  roof.rotation.y = Math.PI / 4;
  g.add(roof);

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.05), mat(0x592e15));
  door.position.set(0, 0.4, 0.81);
  g.add(door);

  g.position.set(x, 0, z);
  return g;
}

function buildFactory(x, z) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(GEO.factoryBase, mat(0x4d4d4d));
  base.position.y = 1.3;
  g.add(base);

  [[-0.5, 1.5], [0.5, 1.5], [-0.5, 0.8], [0.5, 0.8]].forEach(([wx, wy]) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.05), mat(0x7ba3b8));
    win.position.set(wx, wy, 1.11);
    g.add(win);
  });

  [[-0.5, 0], [0.5, 0]].forEach(([cx, cz]) => {
    const stack = new THREE.Mesh(GEO.factoryStack, mat(0x3d3d3d));
    stack.position.set(cx, 3.6, cz);
    g.add(stack);
  });

  g.position.set(x, 0, z);
  return g;
}

function buildSmokePuffs(factoryGroup, count = 5) {
  const smokeMeshes = [];
  const smokeMat = basicMat(0x666666, { transparent: true, opacity: 0.45 });

  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(GEO.smokeBox, smokeMat.clone());
    const stack = i % 2 === 0 ? -0.5 : 0.5;
    mesh.position.set(
      factoryGroup.position.x + stack + (Math.random() - 0.5) * 0.25,
      3.8 + i * 0.5,
      factoryGroup.position.z + (Math.random() - 0.5) * 0.25
    );
    mesh.userData = {
      type: 'smoke',
      smokeSpeed: 0.007 + Math.random() * 0.006,
      originY: 3.8,
      originX: factoryGroup.position.x + stack,
      originZ: factoryGroup.position.z,
      baseOpacity: 0.45,
      baseScale: 0.8 + Math.random() * 0.3,
      driftX: (Math.random() - 0.5) * 0.003,
      driftZ: (Math.random() - 0.5) * 0.003,
      pulseOffset: Math.random() * Math.PI * 2,
    };
    smokeMeshes.push(mesh);
  }
  return smokeMeshes;
}

function buildWindTurbine(x, z) {
  const g = new THREE.Group();
  g.userData.type = 'wind-turbine';

  const mast = new THREE.Mesh(GEO.turbineMast, mat(0xdddddd));
  mast.position.y = 2.0;
  g.add(mast);

  const hub = new THREE.Mesh(GEO.turbineHub, mat(0xcccccc));
  hub.position.y = 4.0;
  g.add(hub);

  const bladeGroup = new THREE.Group();
  bladeGroup.position.set(0, 4.0, 0.25);

  for (let i = 0; i < 3; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.z = (i * Math.PI * 2) / 3;

    const blade = new THREE.Mesh(GEO.turbineBlade, mat(0xffffff));
    blade.position.y = 0.8;
    pivot.add(blade);
    bladeGroup.add(pivot);
  }
  g.add(bladeGroup);
  g.position.set(x, 0, z);
  return g;
}

function buildSolarPanel(x, z) {
  const g = new THREE.Group();
  
  const leg1 = new THREE.Mesh(GEO.solarLeg, mat(0x666666));
  leg1.position.set(-0.35, 0.2, 0);
  g.add(leg1);

  const leg2 = new THREE.Mesh(GEO.solarLeg, mat(0x666666));
  leg2.position.set(0.35, 0.2, 0);
  g.add(leg2);

  const panelFrame = new THREE.Group();
  panelFrame.position.y = 0.4;
  panelFrame.rotation.x = 0.4;

  const frameBorder = new THREE.Mesh(GEO.solarFrame, mat(0x222222));
  panelFrame.add(frameBorder);

  const cellScreen = new THREE.Mesh(GEO.solarPanel, mat(0x0e244d));
  cellScreen.position.y = 0.02;
  panelFrame.add(cellScreen);

  g.add(panelFrame);
  g.position.set(x, 0, z);
  return g;
}

function buildBushCluster(x, z) {
  const g = new THREE.Group();
  const bushMat = mat(0x315c34);

  const b1 = new THREE.Mesh(GEO.bush, bushMat);
  b1.position.set(0, 0.25, 0);
  g.add(b1);

  const b2 = new THREE.Mesh(GEO.bush, bushMat);
  b2.position.set(0.28, 0.2, 0.08);
  b2.scale.setScalar(0.75);
  g.add(b2);

  g.position.set(x, 0, z);
  return g;
}

// FIXED: Raised road heights from 0.1 / 0.12 to 0.26 / 0.28 to stay cleanly above island soil
function buildRoad(group) {
  const road = new THREE.Mesh(GEO.road, mat(0x1a1a1a));
  road.position.set(0, 0.26, 2.0);
  group.add(road);

  const line = new THREE.Mesh(GEO.roadLine, basicMat(0xdddddd));
  line.position.set(0, 0.28, 2.0);
  group.add(line);
}

function buildVehicle(transport) {
  if (!transport || transport === 'walk') return null;

  const g = new THREE.Group();
  const wheels = [];

  const addWheel = (x, z) => {
    const w = new THREE.Mesh(GEO.wheel, mat(0x111111));
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.06, z);
    g.add(w);
    wheels.push(w);
  };

  if (transport === 'bicycle') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.05), mat(0x507d30));
    frame.position.set(0, 0.35, 0);
    g.add(frame);
    addWheel(-0.45, 0);
    addWheel(0.45, 0);
  } else if (transport === 'bus' || transport === 'train') {
    const col = transport === 'bus' ? 0x255bb3 : 0x3b7d79;
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 0.7), mat(col));
    body.position.set(0, 0.45, 0);
    g.add(body);
    addWheel(-0.8, 0);
    addWheel(0.8, 0);
  } else {
    // Car/Motorcycle default low-poly car
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.8), mat(0xbf5d21));
    body.position.set(0, 0.45, 0);
    g.add(body);
    addWheel(-0.6, 0.35);
    addWheel(-0.6, -0.35);
    addWheel(0.6, 0.35);
    addWheel(0.6, -0.35);
  }

  // FIXED: Adjusted base offset to y = 0.38 so vehicles ride on top of the elevated road surface
  g.position.set(0, 0.38, 2.0);
  return {
    group: g,
    wheels,
    speed: transport === 'train' ? 0.001 : transport === 'bus' ? 0.0012 : 0.0018,
    amplitude: transport === 'train' ? 6.5 : transport === 'bus' ? 6.0 : 5.0,
  };
}

// State assembler logic
function buildPollutedScene(transport, pollutionLevel) {
  const group = new THREE.Group();
  
  // Base core
  const base = new THREE.Mesh(GEO.islandBody, mat(0x402b20));
  base.position.y = -1.4;
  group.add(base);

  const top = new THREE.Mesh(GEO.islandTop, mat(0x354d31));
  top.position.y = 0.02;
  group.add(top);

  buildRoad(group);

  // Bare trees
  [[-4.0, -2.0], [-2.5, 3.2], [2.2, -3.8], [3.5, 1.8], [-5.0, 0.5]].forEach(([x, z]) => {
    group.add(buildBareTree(x, z));
  });

  group.add(buildHouse(3.0, -1.8));

  const factory = buildFactory(-2.0, -1.2);
  group.add(factory);

  const smoke = buildSmokePuffs(factory, 4 + Math.round(pollutionLevel * 4));
  smoke.forEach((m) => group.add(m));

  const vehicle = buildVehicle(transport);
  if (vehicle) group.add(vehicle.group);

  return { group, smokeMeshes: smoke, vehicle };
}

function buildNeutralScene(transport, pollutionLevel) {
  const group = new THREE.Group();

  const base = new THREE.Mesh(GEO.islandBody, mat(0x4f3528));
  base.position.y = -1.4;
  group.add(base);

  const top = new THREE.Mesh(GEO.islandTop, mat(0x3e6e39));
  top.position.y = 0.02;
  group.add(top);

  buildRoad(group);

  [[-3.8, -1.8], [-2.0, 3.0], [3.2, 3.2]].forEach(([x, z]) => group.add(buildGreenTree(x, z)));
  [[2.8, -3.2], [-4.5, 0.8]].forEach(([x, z]) => group.add(buildBareTree(x, z)));

  group.add(buildHouse(2.2, -1.4));
  group.add(buildBushCluster(-3.0, -3.2));

  const vehicle = buildVehicle(transport);
  if (vehicle) group.add(vehicle.group);

  return { group, smokeMeshes: [], vehicle };
}

function buildGreenScene(transport) {
  const group = new THREE.Group();

  const base = new THREE.Mesh(GEO.islandBody, mat(0x5c4033));
  base.position.y = -1.4;
  group.add(base);

  const top = new THREE.Mesh(GEO.islandTop, mat(0x4a7c45));
  top.position.y = 0.02;
  group.add(top);

  buildRoad(group);

  [
    [-4.2, -1.8, 1.0],
    [-2.5, 3.0, 0.95],
    [3.5, 2.8, 1.05],
    [4.0, -1.2, 0.85],
    [-4.8, 0.4, 1.0],
    [1.2, -4.2, 0.95]
  ].forEach(([x, z, s]) => group.add(buildGreenTree(x, z, s)));

  group.add(buildHouse(2.2, -1.4));
  group.add(buildWindTurbine(-3.0, -3.2));
  group.add(buildWindTurbine(4.2, 0.8));
  group.add(buildSolarPanel(-1.2, -2.8));
  group.add(buildSolarPanel(0.5, -3.5));
  group.add(buildBushCluster(-3.2, 1.8));
  group.add(buildBushCluster(1.8, 3.2));

  const vehicle = buildVehicle(transport);
  if (vehicle) group.add(vehicle.group);

  return { group, smokeMeshes: [], vehicle };
}

// ============================================================================
// 4. MAIN THREE.JS DISPLAY CANVAS COMPONENT
// ============================================================================

function EcoIsland3D({ score, transportChoice = 'car' }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  
  const activeGroupRef = useRef(null);
  const smokeMeshesRef = useRef([]);
  const vehicleRef = useRef(null);
  const currentStateRef = useRef(null);

  // Dynamic state transition tracking
  const tweenRef = useRef(null);

  // 100% Reliable Custom Rotation State (No OrbitControls required)
  const rotationRef = useRef({
    theta: -Math.PI / 4, // horizontal position
    phi: Math.PI / 3.5,  // vertical angle
    radius: DEFAULT_CAMERA_DISTANCE,
    isDragging: false,
    startX: 0,
    startY: 0,
    targetTheta: -Math.PI / 4,
    targetPhi: Math.PI / 3.5,
  });

  const buildScene = useCallback((state, transport, pollutionLevel) => {
    switch (state) {
      case 'Polluted': return buildPollutedScene(transport, pollutionLevel);
      case 'Neutral':  return buildNeutralScene(transport, pollutionLevel);
      case 'Green':
      default:         return buildGreenScene(transport);
    }
  }, []);

  const applyEnvironmentTone = useCallback((scene, state, pollutionLevel) => {
    const baseColors = {
      Polluted: new THREE.Color(0x0c131a),
      Neutral:  new THREE.Color(0x5c8fa6),
      Green:    new THREE.Color(0x82ceeb),
    };
    const ambientIntensities = {
      Polluted: 0.35,
      Neutral:  0.65,
      Green:    0.95,
    };
    const fogDensity = {
      Polluted: 0.025,
      Neutral:  0.012,
      Green:    0.003,
    };

    const bgColor = baseColors[state] || baseColors.Neutral;
    scene.background = bgColor;
    scene.fog = new THREE.FogExp2(bgColor.getHex(), fogDensity[state] || 0.01);

    scene.traverse((child) => {
      if (child.isLight && child.userData.type === 'ambient') {
        child.intensity = ambientIntensities[state] || 0.6;
      }
      if (child.isLight && child.userData.type === 'sun') {
        child.intensity = state === 'Polluted' ? 0.4 : state === 'Neutral' ? 0.8 : 1.1;
      }
    });
  }, []);

  // Primary rendering mount lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // StrictMode safeguard check
    if (container.querySelector('canvas')) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    // WebGL setup
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch (e) {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 150);
    cameraRef.current = camera;

    // Static lighting rig
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    ambient.userData.type = 'ambient';
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfffaed, 0.8);
    sun.position.set(12, 18, 8);
    sun.userData.type = 'sun';
    scene.add(sun);

    // Assembly
    const initialScope = deriveState(score);
    const pollutionLevel = getPollutionLevel(score);
    const { group, smokeMeshes, vehicle } = buildScene(initialScope, transportChoice, pollutionLevel);
    
    scene.add(group);
    activeGroupRef.current = group;
    smokeMeshesRef.current = smokeMeshes;
    vehicleRef.current = vehicle;
    currentStateRef.current = initialScope;

    // Water level background
    const water = new THREE.Mesh(GEO.water, mat(WATER_COLORS[initialScope]));
    water.position.set(0, -2.8, 0);
    scene.add(water);

    applyEnvironmentTone(scene, initialScope, pollutionLevel);

    // Interactive custom drag/touch controllers
    const stateController = rotationRef.current;

    const handleMouseDown = (e) => {
      stateController.isDragging = true;
      stateController.startX = e.clientX;
      stateController.startY = e.clientY;
    };

    const handleMouseMove = (e) => {
      if (!stateController.isDragging) return;
      const dx = e.clientX - stateController.startX;
      const dy = e.clientY - stateController.startY;

      stateController.targetTheta -= dx * 0.007;
      stateController.targetPhi = Math.max(
        0.15,
        Math.min(Math.PI / 2.1, stateController.targetPhi - dy * 0.007)
      );

      stateController.startX = e.clientX;
      stateController.startY = e.clientY;
    };

    const handleMouseUp = () => {
      stateController.isDragging = false;
    };

    const handleWheel = (e) => {
      stateController.radius = Math.max(
        8,
        Math.min(35, stateController.radius + e.deltaY * 0.025)
      );
    };

    // Mobile touch controls translation
    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      stateController.isDragging = true;
      stateController.startX = e.touches[0].clientX;
      stateController.startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!stateController.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - stateController.startX;
      const dy = e.touches[0].clientY - stateController.startY;

      stateController.targetTheta -= dx * 0.01;
      stateController.targetPhi = Math.max(
        0.15,
        Math.min(Math.PI / 2.1, stateController.targetPhi - dy * 0.01)
      );

      stateController.startX = e.touches[0].clientX;
      stateController.startY = e.touches[0].clientY;
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleMouseUp);

    // Resize frame updater
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    let animationId;
    const animateLoop = (time) => {
      animationId = requestAnimationFrame(animateLoop);

      // Dampened camera movement interpolation
      stateController.theta += (stateController.targetTheta - stateController.theta) * 0.12;
      stateController.phi += (stateController.targetPhi - stateController.phi) * 0.12;

      camera.position.x = stateController.radius * Math.sin(stateController.phi) * Math.sin(stateController.theta);
      camera.position.y = stateController.radius * Math.cos(stateController.phi);
      camera.position.z = stateController.radius * Math.sin(stateController.phi) * Math.cos(stateController.theta);
      camera.lookAt(0, -0.4, 0);

      // Rotors
      if (activeGroupRef.current) {
        activeGroupRef.current.traverse((child) => {
          if (child.userData.type === 'wind-turbine') {
            child.children.forEach((c) => {
              if (c.type === 'Group') c.rotation.z += 0.03;
            });
          }
        });
      }

      // Smog rising translation
      if (smokeMeshesRef.current) {
        smokeMeshesRef.current.forEach((mesh) => {
          mesh.position.y += mesh.userData.smokeSpeed;
          mesh.position.x += mesh.userData.driftX;
          mesh.position.z += mesh.userData.driftZ;
          const pulse = 1 + Math.sin(time * 0.004 + mesh.userData.pulseOffset) * 0.15;
          mesh.scale.setScalar(mesh.userData.baseScale * pulse);
          if (mesh.position.y > mesh.userData.originY + 2.8) {
            mesh.position.y = mesh.userData.originY;
            mesh.position.x = mesh.userData.originX;
            mesh.position.z = mesh.userData.originZ;
          }
        });
      }

      // Cars loop path
      if (vehicleRef.current) {
        const { group: car, wheels, speed, amplitude } = vehicleRef.current;
        const phase = time * speed;
        car.position.x = Math.sin(phase) * amplitude;
        car.rotation.y = Math.sin(phase + 0.01) >= Math.sin(phase) ? 0 : Math.PI;
        wheels.forEach((w) => {
          w.rotation.z -= 0.22;
        });
      }

      // Tween solver
      if (tweenRef.current) {
        const elapsed = time - tweenRef.current.start;
        const t = Math.min(elapsed / TRANSITION_MS, 1);
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        // Animate state change opacities
        const setOpacity = (g, op) => {
          if (!g) return;
          g.traverse((child) => {
            if (child.isMesh && child.material && child.userData.type !== 'smoke') {
              child.material.transparent = op < 1;
              child.material.opacity = op;
            }
          });
        };

        setOpacity(tweenRef.current.from, 1 - eased);
        setOpacity(tweenRef.current.to, eased);

        if (t >= 1) {
          scene.remove(tweenRef.current.from);
          setOpacity(tweenRef.current.to, 1);
          tweenRef.current = null;
        }
      }

      renderer.render(scene, camera);
    };

    animationId = requestAnimationFrame(animateLoop);

    // Safe memory teardown
    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update loop on score updates
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !currentStateRef.current) return;

    const targetState = deriveState(score);
    const pollutionLevel = getPollutionLevel(score);

    if (targetState === currentStateRef.current) {
      applyEnvironmentTone(scene, targetState, pollutionLevel);
      return;
    }

    if (tweenRef.current) {
      scene.remove(tweenRef.current.from);
      tweenRef.current = null;
    }

    const { group: incoming, smokeMeshes: incomingSmoke, vehicle: incomingVehicle } = buildScene(targetState, transportChoice, pollutionLevel);
    
    // Set transparent to prepare for transition
    incoming.traverse((child) => {
      if (child.isMesh && child.material && child.userData.type !== 'smoke') {
        child.material.transparent = true;
        child.material.opacity = 0;
      }
    });

    scene.add(incoming);

    const outgoing = activeGroupRef.current;
    tweenRef.current = {
      start: performance.now(),
      from: outgoing,
      to: incoming,
    };

    activeGroupRef.current = incoming;
    smokeMeshesRef.current = incomingSmoke;
    vehicleRef.current = incomingVehicle;
    currentStateRef.current = targetState;

    applyEnvironmentTone(scene, targetState, pollutionLevel);
  }, [score, transportChoice, buildScene, applyEnvironmentTone]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full min-h-[420px] lg:min-h-0 bg-slate-950 relative rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing shadow-inner"
      style={{ touchAction: 'none' }}
    />
  );
}

// ============================================================================
// 5. AI ADVISOR CLIENT
// ============================================================================
// Calls the secure Express backend proxy (POST /api/advisor), which holds the
// Gemini API key server-side and never exposes it to the browser (see
// backend/services/gemini.js). On static hosts with no backend available
// (e.g. the GitHub Pages demo) this falls back to a deterministic,
// context-aware message so the flow stays usable without credentials.

const ADVISOR_TIMEOUT_MS = 10_000;

async function fetchGeminiAdvice(score, actionLog) {
  const action = actionLog || 'Started my sustainability journey';
  const isStaticHost =
    typeof window !== 'undefined' && window.location.hostname.includes('github.io');

  if (isStaticHost) {
    return getOfflineFallbackAdvice(score, action);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ADVISOR_TIMEOUT_MS);

  try {
    const response = await fetch('/api/advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, score }),
      signal: controller.signal,
    });

    const data = await response.json();
    if (!response.ok || !data.advice) {
      throw new Error(data?.error || `Server responded ${response.status}`);
    }
    return data.advice;
  } catch (err) {
    // Network error, timeout, or backend not running locally — degrade
    // gracefully instead of breaking the advisor panel.
    return getOfflineFallbackAdvice(score, action);
  } finally {
    clearTimeout(timer);
  }
}

function getOfflineFallbackAdvice(score, action) {
  const state = deriveState(score);
  if (state === 'Polluted') {
    return "Every step counts! Planting plants and swapping your commute to a bike will lower emissions. Your low-poly forest is waiting to grow!";
  }
  if (state === 'Neutral') {
    return "Great progress! Consider upgrading to LED lighting or taking shorter showers. You are well on your way to earning wind turbines!";
  }
  return "Incredible work! Your ecosystem is sparkling clean. Keep maintaining these habits to inspire others in your neighborhood!";
}

// ============================================================================
// 6. SUB-COMPONENTS (Quiz, ScoreCard, ActionLogger, AIAdvisor, Toast)
// ============================================================================

function CarbonQuiz({ onComplete }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    transport: '',
    ac: '',
    diet: '',
    electricity: '',
    waste: '',
  });

  const questions = [
    {
      id: 'transport',
      title: 'How do you usually get around for school/work?',
      icon: '🚲',
      options: [
        { label: 'Walk or Bicycle', points: 20, raw: 'walk' },
        { label: 'Public Transit (Bus/Train)', points: 15, raw: 'bus' },
        { label: 'Carpool or Ride Share', points: 10, raw: 'car' },
        { label: 'Drive Alone (Gas vehicle)', points: 5, raw: 'car' },
      ],
    },
    {
      id: 'ac',
      title: 'How often is the Air Conditioning (AC) running in your home?',
      icon: '❄️',
      options: [
        { label: 'Rarely / We use fans instead', points: 20 },
        { label: 'Only during hot afternoons', points: 15 },
        { label: 'Often (kept under 23°C)', points: 10 },
        { label: 'Always running in multiple rooms', points: 5 },
      ],
    },
    {
      id: 'diet',
      title: 'What does your average daily food intake look like?',
      icon: '🥗',
      options: [
        { label: 'Fully Plant-based (Vegan/Veg)', points: 20 },
        { label: 'Poultry/Fish (Low red meat)', points: 15 },
        { label: 'Mixed / Occasional beef or pork', points: 10 },
        { label: 'Frequent meat meals every day', points: 5 },
      ],
    },
    {
      id: 'electricity',
      title: 'Do you make an active effort to turn off appliances?',
      icon: '🔌',
      options: [
        { label: 'Always, we have smart strips and LED bulbs', points: 20 },
        { label: 'Yes, I switch off empty room lights', points: 15 },
        { label: 'Sometimes, but I leave screens plugged in', points: 10 },
        { label: 'Hardly ever / Electronics stay on 24/7', points: 5 },
      ],
    },
    {
      id: 'waste',
      title: 'How often do you use reusable cups, bags, and containers?',
      icon: '🛍️',
      options: [
        { label: 'Always / I carry a reusable bottle', points: 20 },
        { label: 'Usually, but occasionally forget', points: 15 },
        { label: 'Rarely, single-use plastic is handier', points: 10 },
        { label: 'Never / I buy bottled water constantly', points: 5 },
      ],
    },
  ];

  const currentQ = questions[step - 1];

  const handleSelect = (points, rawChoice) => {
    const updatedAnswers = { ...answers, [currentQ.id]: points };
    if (currentQ.id === 'transport' && rawChoice) {
      updatedAnswers.transportChoice = rawChoice;
    }
    setAnswers(updatedAnswers);

    if (step < questions.length) {
      setStep(step + 1);
    } else {
      // Calculate total starting score
      const totalScore = computeQuizScore(updatedAnswers);
      onComplete(totalScore, updatedAnswers.transportChoice || 'car');
    }
  };

  return (
    <div className="w-full max-w-xl bg-slate-900 border border-emerald-800/30 p-8 rounded-3xl shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <span className="text-emerald-400 font-bold tracking-wide uppercase text-xs">Carbon Footprint Setup</span>
        <span className="text-slate-400 text-sm font-medium">Step {step} of 5</span>
      </div>

      <div className="w-full bg-slate-800 h-2 rounded-full mb-8 overflow-hidden">
        <div 
          className="bg-emerald-500 h-full transition-all duration-300"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      <div className="text-center mb-8">
        <span className="text-5xl mb-4 block animate-bounce">{currentQ.icon}</span>
        <h2 className="text-xl md:text-2xl font-bold text-slate-100 leading-snug">{currentQ.title}</h2>
      </div>

      <div className="space-y-3">
        {currentQ.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(opt.points, opt.raw)}
            aria-label={`Select option: ${opt.label}`}
            className="w-full py-4 px-6 text-left bg-slate-800/60 hover:bg-emerald-900/40 hover:border-emerald-500/50 border border-slate-700/60 rounded-2xl text-slate-200 transition-all duration-200 font-medium text-sm flex justify-between items-center group"
          >
            <span>{opt.label}</span>
            <span className="opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity font-bold">Select &rarr;</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ScoreCard({ score }) {
  const status = deriveState(score);
  const colorClass = status === 'Green' ? 'text-emerald-400' : status === 'Neutral' ? 'text-sky-400' : 'text-amber-500';

  return (
    <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Carbon Score</span>
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-4xl font-extrabold text-slate-100 tracking-tight">
            {score}<span className="text-slate-500 text-lg">/100</span>
          </h3>
          <span className={`text-sm font-bold ${colorClass}`}>{status} Status</span>
        </div>
        <span className="text-3xl">
          {status === 'Green' ? '🌿' : status === 'Neutral' ? '🌤️' : '🏭'}
        </span>
      </div>
    </div>
  );
}

function ActionLogger({ score, setScore, onAction }) {
  const [activeItems, setActiveItems] = useState([]);

  const handleToggle = (id, points, label) => {
    if (activeItems.includes(id)) {
      setActiveItems(activeItems.filter(x => x !== id));
      setScore(applyActionDelta(score, points, false));
    } else {
      setActiveItems([...activeItems, id]);
      setScore(applyActionDelta(score, points, true));
      onAction(label);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-3">Eco Actions Logger</span>
      <div className="grid grid-cols-1 gap-2">
        {ECO_HABITS.map((item) => {
          const active = activeItems.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleToggle(item.id, item.points, item.label)}
              aria-label={`${active ? 'Deselect and remove' : 'Log and add'} eco action habit: ${item.label}`}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                active 
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' 
                  : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs font-semibold">{item.label}</span>
              </div>
              <span className={`text-xs font-bold ${active ? 'text-emerald-400' : 'text-slate-500'}`}>
                {active ? 'Done!' : `+${item.points}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AIAdvisor({ lastAction, score }) {
  const [advice, setAdvice] = useState('Generating advice...');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const text = await fetchGeminiAdvice(score, lastAction);
      if (active) {
        setAdvice(text);
        setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [lastAction, score]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden flex-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">AI Advisor Suggestions</span>
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${loading ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${loading ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
          </span>
        </div>
        <p className="text-slate-300 text-xs font-medium leading-relaxed italic">
          "{advice}"
        </p>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2">
        <span className="bg-emerald-900/40 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-bold">GEMINI FLASH</span>
        <span className="text-[9px] text-slate-500 font-medium">Real-time analysis active</span>
      </div>
    </div>
  );
}

// ============================================================================
// 7. PRIMARY SYSTEM ENTRY POINT (Dashboard Layout)
// ============================================================================

export default function App() {
  const [view, setView] = useState('landing');
  const [score, setScore] = useState(50);
  const [transport, setTransport] = useState('car');
  
  const [lastAction, setLastAction] = useState('Quiz Completion');
  const [toast, setToast] = useState(null);
  const [banner, setBanner] = useState(null);

  const prevScore = useRef(score);
  const prevState = useRef(deriveState(score));

  // State transitions Toast/Banner controller
  useEffect(() => {
    if (view !== 'dashboard') return;
    
    const prevVal = prevScore.current;
    const prevSt = prevState.current;
    const nextSt = deriveState(score);

    if (score !== prevVal) {
      const delta = score - prevVal;
      setToast(`Score changed: ${prevVal} → ${score} (${delta > 0 ? '+' : ''}${delta} pts)`);
      const timer = setTimeout(() => setToast(null), 3000);

      if (nextSt !== prevSt) {
        setBanner(STATE_TRANSITION_MSG[nextSt]);
        const bannerTimer = setTimeout(() => setBanner(null), 6000);
        prevState.current = nextSt;
      }

      prevScore.current = score;
      return () => {
        clearTimeout(timer);
      };
    }
  }, [score, view]);

  const handleQuizComplete = (finalScore, selectedTransport) => {
    setScore(finalScore);
    setTransport(selectedTransport);
    prevScore.current = finalScore;
    prevState.current = deriveState(finalScore);
    setView('dashboard');
  };

  const handleActionLogged = (actionLabel) => {
    setLastAction(actionLabel);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      
      {/* ── HEADER NAVBAR ── */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍃</span>
            <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              ECOFORGE 3D
            </h1>
          </div>
          {view === 'dashboard' && (
            <button
              onClick={() => setView('landing')}
              aria-label="Reset simulation and return to footprint evaluation setup"
              className="text-xs font-bold text-slate-400 hover:text-slate-200 border border-slate-800 bg-slate-900/60 px-4 py-2 rounded-xl transition"
            >
              Reset Simulation
            </button>
          )}
        </div>
      </header>

      {/* ── STATE TRANSITION BANNER ── */}
      {banner && (
        <div className="bg-emerald-950/90 border-b border-emerald-500 text-emerald-200 text-center py-2 px-4 text-xs font-semibold animate-slide-down">
          {banner}
        </div>
      )}

      {/* ── PRIMARY CONTAINER ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col justify-center items-center">
        
        {/* Landing Page */}
        {view === 'landing' && (
          <div className="max-w-3xl text-center space-y-8 py-10">
            <div className="space-y-4">
              <span className="inline-block bg-emerald-950 border border-emerald-800/40 text-emerald-400 text-xs px-4 py-1.5 rounded-full font-bold tracking-wider uppercase animate-pulse">
                Environmental Awareness Simulation
              </span>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-slate-100 leading-none">
                Visualize Your <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Carbon Footprint</span> In Real-Time
              </h2>
              <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto font-medium">
                Your daily lifestyle determines the state of a virtual floating 3D island. Turn a dark, smoggy wasteland into a clean eco-paradise.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {[
                { label: '3D Simulation', desc: 'No heavy engines', icon: '⛰️' },
                { label: 'Gemini AI Advisor', desc: 'Custom feedback', icon: '🧠' },
                { label: 'Dynamic Transitions', desc: 'Real-time changes', icon: '⚡' },
                { label: 'Zero DB footprint', desc: 'Runs fully local', icon: '🔒' }
              ].map((card, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-900 p-4 rounded-2xl text-center">
                  <span className="text-2xl mb-1 block">{card.icon}</span>
                  <h4 className="text-xs font-bold text-slate-200">{card.label}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">{card.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setView('quiz')}
              aria-label="Begin carbon footprint assessment initialization quiz"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-emerald-500/20 shadow-emerald-500/10 transition duration-200 transform hover:-translate-y-0.5 text-sm"
            >
              Begin Footprint Assessment
            </button>
          </div>
        )}

        {/* Quiz Steps */}
        {view === 'quiz' && (
          <CarbonQuiz onComplete={handleQuizComplete} />
        )}

        {/* Dashboard Canvas & sidebar */}
        {view === 'dashboard' && (
          <div className="w-full flex-1 flex flex-col lg:flex-row gap-4 h-full min-h-[500px]">
            {/* Left side: Interactive Canvas */}
            <div className="flex-1 bg-slate-900/40 border border-slate-900 rounded-3xl p-3 relative flex flex-col min-h-[420px] lg:min-h-0">
              <EcoIsland3D score={score} transportChoice={transport} />
              
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-center select-none">
                <p className="text-[10px] font-bold tracking-wider text-slate-400 bg-slate-950/80 px-4 py-1.5 rounded-full border border-slate-800 shadow">
                  Drag Left/Right to Rotate · Scroll/Pinch to Zoom
                </p>
              </div>
            </div>

            {/* Right Side: Loggers and Metrics */}
            <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-3">
              <ScoreCard score={score} />
              <ActionLogger score={score} setScore={setScore} onAction={handleActionLogged} />
              <AIAdvisor lastAction={lastAction} score={score} />
            </div>
          </div>
        )}

      </main>

      {/* ── TOAST DISCOVERY BAR ── */}
{toast && (
  <div 
    role="status"
    aria-live="polite"
    aria-atomic="true"
    className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 shadow-2xl px-5 py-3 rounded-2xl z-50 animate-slide-up flex items-center gap-3"
  >
    <span className="text-emerald-400" aria-hidden="true">⚡</span>
    <span className="text-xs font-semibold text-slate-200">{toast}</span>
  </div>
)}

      {/* ── COMPREHENSIVE FOOTER ── */}
      <footer className="border-t border-slate-900 py-4 px-6 text-center">
        <p className="text-[10px] text-slate-500 font-semibold tracking-wide">
          EcoForge 3D — Developed with React 18 & Three.js. Real-time insights calibrated using Gemini 2.5-Flash.
        </p>
      </footer>

    </div>
  );
}