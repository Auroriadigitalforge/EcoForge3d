/**
 * islandScene.js
 *
 * Pure Three.js scene-building utilities for EcoIsland3D.
 * NO React imports — this module is framework-agnostic.
 *
 * All geometry is built exclusively from:
 *   BoxGeometry, SphereGeometry, CylinderGeometry, ConeGeometry
 *
 * NO THREE.Points, NO shadows, NO HDR, NO physics.
 * Smoke is animated BoxGeometry meshes (userData.type = 'smoke').
 */

import * as THREE from 'three';

const GEO = {
  islandBody:   new THREE.CylinderGeometry(10.5, 8.2, 2.8, 8),
  islandTop:    new THREE.CylinderGeometry(10.1, 10.5, 0.45, 8),
  water:        new THREE.BoxGeometry(40, 0.3, 40),
  trunk:        new THREE.CylinderGeometry(0.18, 0.22, 1.4, 6),
  canopyLarge:  new THREE.SphereGeometry(0.9, 6, 5),
  canopyMed:    new THREE.SphereGeometry(0.65, 6, 5),
  houseBody:    new THREE.BoxGeometry(1.8, 1.6, 1.8),
  houseRoof:    new THREE.ConeGeometry(1.5, 1.1, 4),
  factoryBase:  new THREE.BoxGeometry(2.4, 3.0, 2.4),
  factoryStack: new THREE.CylinderGeometry(0.35, 0.45, 2.2, 8),
  smokeBox:     new THREE.BoxGeometry(0.35, 0.35, 0.35),
  turbineMast:  new THREE.CylinderGeometry(0.15, 0.22, 4.5, 6),
  turbineHub:   new THREE.SphereGeometry(0.25, 6, 4),
  turbineBlade: new THREE.BoxGeometry(0.15, 1.8, 0.08),
  solarFrame:   new THREE.BoxGeometry(1.4, 0.06, 0.9),
  solarPanel:   new THREE.BoxGeometry(1.3, 0.04, 0.8),
  solarLeg:     new THREE.CylinderGeometry(0.05, 0.05, 0.5, 4),
  bush:         new THREE.SphereGeometry(0.5, 5, 4),
  road:         new THREE.BoxGeometry(20, 0.08, 3.25),
  roadLine:     new THREE.BoxGeometry(18.4, 0.02, 0.1),
  wheel:        new THREE.CylinderGeometry(0.22, 0.22, 0.14, 12),
};

function mat(color, options = {}) {
  return new THREE.MeshLambertMaterial({ color, ...options });
}

function basicMat(color, options = {}) {
  return new THREE.MeshBasicMaterial({ color, ...options });
}

function normalizeTransportChoice(choice) {
  if (typeof choice !== 'string') return null;
  const normalized = choice.trim().toLowerCase();
  return normalized || null;
}

export const SKY_COLORS = {
  Polluted: 0x1a1a2e,
  Neutral:  0x7eb8d4,
  Green:    0x87ceeb,
};

export const WATER_COLORS = {
  Polluted: 0x2d4a22,
  Neutral:  0x4a90b8,
  Green:    0x1ca3ec,
};

export function buildIslandBase(group) {
  const body = new THREE.Mesh(GEO.islandBody, mat(0x5c4033));
  body.position.y = -1.4;
  group.add(body);

  const top = new THREE.Mesh(GEO.islandTop, mat(0x4a7c45));
  top.position.y = 0.02;
  group.add(top);
}

export function buildWater(group, state) {
  const water = new THREE.Mesh(GEO.water, mat(WATER_COLORS[state]));
  water.position.set(0, -3.2, 0);
  water.userData.type = 'water';
  group.add(water);
}

function buildBareTree(x, z) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(GEO.trunk, mat(0x5a3a1a));
  trunk.position.y = 0.7;
  g.add(trunk);

  [-0.3, 0.3].forEach((dx) => {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.08, 0.5, 4),
      mat(0x5a3a1a),
    );
    branch.rotation.z = dx > 0 ? 0.6 : -0.6;
    branch.position.set(dx * 0.4, 1.2, 0);
    g.add(branch);
  });

  g.position.set(x, 0, z);
  g.userData.type = 'tree-bare';
  return g;
}

function buildGreenTree(x, z, scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(GEO.trunk, mat(0x5a3a1a));
  trunk.position.y = 0.7;
  g.add(trunk);

  const canopy = new THREE.Mesh(GEO.canopyLarge, mat(0x2e7d32));
  canopy.position.y = 1.8;
  g.add(canopy);

  const canopyTop = new THREE.Mesh(GEO.canopyMed, mat(0x388e3c));
  canopyTop.position.y = 2.55;
  g.add(canopyTop);

  g.scale.setScalar(scale);
  g.position.set(x, 0, z);
  g.userData.type = 'tree-green';
  return g;
}

function buildHouse(x, z) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(GEO.houseBody, mat(0xe8d5b0));
  body.position.y = 0.8;
  g.add(body);

  const roof = new THREE.Mesh(GEO.houseRoof, mat(0xb5451b));
  roof.position.y = 2.15;
  g.add(roof);

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.05), mat(0x6d3b1e));
  door.position.set(0, 0.5, 0.92);
  g.add(door);

  g.position.set(x, 0, z);
  g.userData.type = 'house';
  return g;
}

export function buildFactory(x, z) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(GEO.factoryBase, mat(0x555555));
  base.position.y = 1.5;
  g.add(base);

  [[-0.6, 1.8], [0.6, 1.8], [-0.6, 0.9], [0.6, 0.9]].forEach(([wx, wy]) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.05), mat(0x88aacc));
    win.position.set(wx, wy, 1.22);
    g.add(win);
  });

  [[-0.6, 0], [0.6, 0]].forEach(([cx, cz]) => {
    const stack = new THREE.Mesh(GEO.factoryStack, mat(0x444444));
    stack.position.set(cx, 4.1, cz);
    g.add(stack);
  });

  g.position.set(x, 0, z);
  g.userData.type = 'factory';
  return g;
}

export function buildSmokeMeshes(factoryGroup, count = 5) {
  const smokeMeshes = [];
  const smokeMat = basicMat(0x888888, { transparent: true, opacity: 0.45 });

  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(GEO.smokeBox, smokeMat.clone());
    const stack = i % 2 === 0 ? -0.6 : 0.6;
    mesh.position.set(
      factoryGroup.position.x + stack + (Math.random() - 0.5) * 0.3,
      4.4 + i * 0.6,
      factoryGroup.position.z + (Math.random() - 0.5) * 0.3,
    );
    mesh.userData.type = 'smoke';
    mesh.userData.smokeSpeed = 0.008 + Math.random() * 0.008;
    mesh.userData.originY = mesh.position.y;
    mesh.userData.originX = mesh.position.x;
    mesh.userData.originZ = mesh.position.z;
    mesh.userData.baseOpacity = 0.45;
    mesh.userData.baseScale = 0.95 + Math.random() * 0.2;
    mesh.userData.driftX = (Math.random() - 0.5) * 0.004;
    mesh.userData.driftZ = (Math.random() - 0.5) * 0.003;
    mesh.userData.pulseOffset = Math.random() * Math.PI * 2;
    mesh.userData.resetY = 4.4 + (i % 3) * 0.4;
    smokeMeshes.push(mesh);
  }

  return smokeMeshes;
}

function buildRoad(group) {
  const road = new THREE.Mesh(GEO.road, mat(0x262626));
  road.position.set(0, 0.12, 2.2);
  road.userData.type = 'road';
  group.add(road);

  const lane = new THREE.Mesh(GEO.roadLine, basicMat(0xf5f5f5));
  lane.position.set(0, 0.16, 2.2);
  lane.userData.type = 'road-line';
  group.add(lane);
}

function createExhaustSmokePuffs(parentGroup, baseX, baseY, baseZ, count = 3, baseOpacity = 0.42) {
  const smokeMeshes = [];
  const smokeMaterial = basicMat(0xb8b8b8, { transparent: true, opacity: baseOpacity });

  for (let i = 0; i < count; i++) {
    const puff = new THREE.Mesh(GEO.smokeBox, smokeMaterial.clone());
    const scale = 1.15 + i * 0.12;
    puff.scale.setScalar(scale);
    puff.position.set(
      baseX - i * 0.06 + (Math.random() - 0.5) * 0.05,
      baseY + i * 0.11,
      baseZ + (Math.random() - 0.5) * 0.05,
    );
    puff.userData.type = 'smoke';
    puff.userData.smokeSpeed = 0.01 + Math.random() * 0.006;
    puff.userData.originY = puff.position.y;
    puff.userData.originX = puff.position.x;
    puff.userData.originZ = puff.position.z;
    puff.userData.baseOpacity = baseOpacity;
    puff.userData.baseScale = scale;
    puff.userData.driftX = (Math.random() - 0.5) * 0.006;
    puff.userData.driftZ = (Math.random() - 0.5) * 0.004;
    puff.userData.pulseOffset = Math.random() * Math.PI * 2;
    parentGroup.add(puff);
    smokeMeshes.push(puff);
  }

  return smokeMeshes;
}

function buildVehicleModel(transportChoice) {
  const transport = normalizeTransportChoice(transportChoice);
  if (!transport || transport === 'walk') return null;

  const vehicleGroup = new THREE.Group();
  const wheels = [];
  let exhaustSmokeMeshes = [];

  const addWheel = (x, z) => {
    const wheel = new THREE.Mesh(GEO.wheel, mat(0x1a1a1a));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.08, z);
    wheel.userData.type = 'wheel';
    vehicleGroup.add(wheel);
    wheels.push(wheel);
    return wheel;
  };

  if (transport === 'bicycle') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.06), mat(0x6c8f3a));
    frame.position.set(0, 0.43, 0);
    frame.rotation.z = 0.18;
    vehicleGroup.add(frame);

    const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.05), mat(0x6c8f3a));
    topBar.position.set(-0.05, 0.62, 0);
    topBar.rotation.z = -0.35;
    vehicleGroup.add(topBar);

    addWheel(-0.62, 0);
    addWheel(0.62, 0);

    const handlebar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.04), mat(0x444444));
    handlebar.position.set(0.58, 0.88, 0);
    handlebar.rotation.z = -0.25;
    vehicleGroup.add(handlebar);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.12), mat(0x2d2d2d));
    seat.position.set(-0.25, 0.82, 0);
    vehicleGroup.add(seat);
  } else if (transport === 'motorcycle') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.32, 0.42), mat(0xd1495b));
    body.position.set(0, 0.55, 0);
    vehicleGroup.add(body);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.24), mat(0x222222));
    seat.position.set(-0.1, 0.82, 0);
    vehicleGroup.add(seat);

    addWheel(-0.48, 0);
    addWheel(0.48, 0);

    exhaustSmokeMeshes = createExhaustSmokePuffs(vehicleGroup, -0.74, 0.55, -0.16, 2, 0.32);
  } else if (transport === 'bus' || transport === 'train') {
    const bodyColor = transport === 'bus' ? 0x2f6fdb : 0x4b8f8c;
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.58, 0.82), mat(bodyColor));
    body.position.set(0, 0.54, 0);
    vehicleGroup.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.18, 0.7), mat(0xf0f6ff));
    roof.position.set(0.12, 0.92, 0);
    vehicleGroup.add(roof);

    const windowMaterial = basicMat(0x9fd6ff);
    [-0.95, -0.35, 0.25, 0.85].forEach((x) => {
      const window = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.04), windowMaterial);
      window.position.set(x, 0.68, 0.43);
      vehicleGroup.add(window);
    });

    [-1.15, -0.2, 0.8, 1.15].forEach((x) => addWheel(x, 0));
    exhaustSmokeMeshes = createExhaustSmokePuffs(vehicleGroup, -1.45, 0.56, -0.18, 3, 0.28);
  } else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.48, 0.98), mat(0xdb7c2b));
    body.position.set(0, 0.56, 0);
    vehicleGroup.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.38, 0.82), mat(0xf3e8d0));
    roof.position.set(0.18, 0.95, 0);
    vehicleGroup.add(roof);

    const window = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.75), basicMat(0x8ecae6));
    window.position.set(0.18, 0.95, 0);
    vehicleGroup.add(window);

    addWheel(-0.82, 0.42);
    addWheel(-0.82, -0.42);
    addWheel(0.82, 0.42);
    addWheel(0.82, -0.42);

    const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.08), basicMat(0xfff1b5));
    headlight.position.set(1.1, 0.56, 0.2);
    vehicleGroup.add(headlight);

    const tailpipe = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.24, 8), mat(0x666666));
    tailpipe.rotation.z = Math.PI / 2;
    tailpipe.position.set(-1.18, 0.36, -0.22);
    vehicleGroup.add(tailpipe);

    exhaustSmokeMeshes = createExhaustSmokePuffs(vehicleGroup, -1.28, 0.39, -0.2, 3, 0.42);
  }

  vehicleGroup.position.set(0, 0.25, 2.2);
  vehicleGroup.userData.type = 'transport-vehicle';
  vehicleGroup.userData.transport = transport;

  return {
    group: vehicleGroup,
    wheels,
    exhaustSmokeMeshes,
    transport,
    speed: transport === 'train' ? 0.00095 : transport === 'bus' ? 0.00125 : transport === 'motorcycle' ? 0.0023 : transport === 'bicycle' ? 0.0016 : 0.00165,
    amplitude: transport === 'train' ? 6.2 : transport === 'bus' ? 6.6 : transport === 'motorcycle' ? 5.9 : transport === 'bicycle' ? 4.8 : 5.4,
  };
}

export function buildPollutedScene(transportChoice = null, pollutionLevel = 1) {
  const group = new THREE.Group();
  buildIslandBase(group);
  buildWater(group, 'Polluted');
  buildRoad(group);

  const treePositions = [
    [-4.5, -2.5], [-3.0, 3.5], [2.5, -4.0], [4.0, 2.0], [-5.5, 0.5],
  ];
  treePositions.forEach(([x, z]) => group.add(buildBareTree(x, z)));

  group.add(buildHouse(3.5, -2.0));

  const factory = buildFactory(-2.5, -1.5);
  group.add(factory);

  const smokeMeshes = buildSmokeMeshes(factory, 5 + Math.round(pollutionLevel * 4));
  smokeMeshes.forEach((mesh) => group.add(mesh));

  const vehicle = buildVehicleModel(transportChoice);
  if (vehicle) group.add(vehicle.group);

  group.userData.state = 'Polluted';
  return { group, smokeMeshes, vehicle };
}

export function buildNeutralScene(transportChoice = null, pollutionLevel = 0.45) {
  const group = new THREE.Group();
  buildIslandBase(group);
  buildWater(group, 'Neutral');
  buildRoad(group);

  [[-4.0, -2.0], [-2.5, 3.0], [3.5, 3.5]].forEach(([x, z]) => group.add(buildGreenTree(x, z)));
  [[3.0, -3.5], [-5.0, 1.0]].forEach(([x, z]) => group.add(buildBareTree(x, z)));

  group.add(buildHouse(2.5, -1.5));
  group.add(buildBushCluster(-3.5, -3.5));

  const smokeMat = new THREE.MeshBasicMaterial({ color: 0x999999, transparent: true, opacity: 0.18 });
  const smokeMeshes = Array.from({ length: 2 + Math.round(pollutionLevel * 2) }, (_, i) => {
    const mesh = new THREE.Mesh(GEO.smokeBox, smokeMat.clone());
    const startY = 5 + i * 0.8;
    mesh.position.set(
      (i - 1) * 2.5 + (Math.random() - 0.5) * 0.5,
      startY,
      (Math.random() - 0.5) * 3,
    );
    mesh.userData.type = 'smoke';
    mesh.userData.smokeSpeed = 0.0045 + Math.random() * 0.004;
    mesh.userData.originY = startY;
    mesh.userData.originX = mesh.position.x;
    mesh.userData.originZ = mesh.position.z;
    mesh.userData.baseScale = 0.95 + Math.random() * 0.2;
    mesh.userData.baseOpacity = 0.18;
    mesh.userData.driftX = (Math.random() - 0.5) * 0.004;
    mesh.userData.driftZ = (Math.random() - 0.5) * 0.003;
    mesh.userData.pulseOffset = Math.random() * Math.PI * 2;
    return mesh;
  });
  smokeMeshes.forEach((mesh) => group.add(mesh));

  const vehicle = buildVehicleModel(transportChoice);
  if (vehicle) group.add(vehicle.group);

  group.userData.state = 'Neutral';
  return { group, smokeMeshes, vehicle };
}

export function buildGreenScene(transportChoice = null) {
  const group = new THREE.Group();
  buildIslandBase(group);
  buildWater(group, 'Green');
  buildRoad(group);

  const treePlacements = [
    [-4.5, -2.0, 1.0],
    [-2.8, 3.2, 0.9],
    [3.8, 3.0, 1.1],
    [4.5, -1.5, 0.85],
    [-5.0, 0.5, 1.0],
    [1.5, -4.5, 0.95],
  ];
  treePlacements.forEach(([x, z, scale]) => group.add(buildGreenTree(x, z, scale)));

  group.add(buildHouse(2.5, -1.5));
  group.add(buildWindTurbine(-3.0, -3.5));
  group.add(buildWindTurbine(4.5, 1.0));
  group.add(buildSolarPanel(-1.5, -3.0));
  group.add(buildSolarPanel(0.5, -3.8));
  group.add(buildBushCluster(-3.5, 2.0));
  group.add(buildBushCluster(2.0, 3.5));

  const vehicle = buildVehicleModel(transportChoice);
  if (vehicle) group.add(vehicle.group);

  group.userData.state = 'Green';
  return { group, smokeMeshes: [], vehicle };
}

/**
 * Low-Poly Wind Turbine Builder
 * Satisfies Req 4.5 (Green state: wind turbines)
 */
export function buildWindTurbine(x, z) {
  const g = new THREE.Group();
  g.userData.type = 'wind-turbine';

  // 1. Tower Mast
  const mast = new THREE.Mesh(GEO.turbineMast, mat(0xe0e0e0));
  mast.position.y = 2.25;
  g.add(mast);

  // 2. Rotor Hub
  const hub = new THREE.Mesh(GEO.turbineHub, mat(0xcccccc));
  hub.position.y = 4.5;
  g.add(hub);

  // 3. Blade Assembly (The rotation loop in EcoIsland3D targets this sub-group)
  const bladeGroup = new THREE.Group();
  bladeGroup.position.set(0, 4.5, 0.3);

  // Create 3 simple low-poly blades spaced symmetrically
  for (let i = 0; i < 3; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.z = (i * Math.PI * 2) / 3;

    const blade = new THREE.Mesh(GEO.turbineBlade, mat(0xffffff));
    blade.position.y = 0.9; // offset from center of hub
    pivot.add(blade);
    
    bladeGroup.add(pivot);
  }
  g.add(bladeGroup);

  g.position.set(x, 0, z);
  return g;
}

/**
 * Low-Poly Solar Panel Builder
 * Satisfies Req 4.5 (Green state: solar panels)
 */
export function buildSolarPanel(x, z) {
  const g = new THREE.Group();
  g.userData.type = 'solar-panel';

  // Base Support structure / legs
  const leg1 = new THREE.Mesh(GEO.solarLeg, mat(0x777777));
  leg1.position.set(-0.4, 0.25, 0);
  g.add(leg1);

  const leg2 = new THREE.Mesh(GEO.solarLeg, mat(0x777777));
  leg2.position.set(0.4, 0.25, 0);
  g.add(leg2);

  // Angled Panel Grid Frame
  const panelFrame = new THREE.Group();
  panelFrame.position.y = 0.5;
  panelFrame.rotation.x = 0.45; // Tilt up toward the sun

  const frameBorder = new THREE.Mesh(GEO.solarFrame, mat(0x333333));
  panelFrame.add(frameBorder);

  const blueGrid = new THREE.Mesh(GEO.solarPanel, mat(0x1a365d));
  blueGrid.position.y = 0.02; // Lift slightly above frame border to prevent clipping
  panelFrame.add(blueGrid);

  g.add(panelFrame);
  g.position.set(x, 0, z);
  return g;
}

/**
 * Low-Poly Foliage/Bush Cluster Builder
 * Used as a filler asset across multiple states
 */
export function buildBushCluster(x, z) {
  const g = new THREE.Group();
  g.userData.type = 'bush-cluster';

  const greenMat = mat(0x3b7a57);

  // Cluster 3 spheres tightly together to simulate a low-poly bush arrangement
  const b1 = new THREE.Mesh(GEO.bush, greenMat);
  b1.position.set(0, 0.3, 0);
  g.add(b1);

  const b2 = new THREE.Mesh(GEO.bush, greenMat);
  b2.position.set(0.35, 0.25, 0.1);
  b2.scale.setScalar(0.8);
  g.add(b2);

  const b3 = new THREE.Mesh(GEO.bush, greenMat);
  b3.position.set(-0.25, 0.2, -0.15);
  b3.scale.setScalar(0.7);
  g.add(b3);

  g.position.set(x, 0, z);
  return g;
}