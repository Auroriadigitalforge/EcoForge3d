import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { deriveState } from '../utils/carbonCalculator.js';
import {
  SKY_COLORS,
  buildPollutedScene,
  buildNeutralScene,
  buildGreenScene,
} from '../utils/islandScene.js';

const DEFAULT_CAMERA_DISTANCE = 18;
const TRANSITION_MS = 900;

export default function EcoIsland3D({ score, transportChoice = null }) {
  const mountRef    = useRef(null);   
  const rendererRef = useRef(null);
  const sceneRef    = useRef(null);
  const cameraRef   = useRef(null);
  const controlsRef = useRef(null);
  const animIdRef   = useRef(null);

  const activeGroupRef   = useRef(null);
  const smokeMeshesRef   = useRef([]);
  const vehicleRef       = useRef(null);
  const currentStateRef  = useRef(null);
  const tweenRef         = useRef(null); 

  function getPollutionLevel(currentScore) {
    const normalized = 1 - Math.max(0, Math.min(100, currentScore)) / 100;
    return Math.max(0, Math.min(1, normalized));
  }

  const buildScene = useCallback((state, transport, pollutionLevel) => {
    switch (state) {
      case 'Polluted': return buildPollutedScene(transport, pollutionLevel);
      case 'Neutral':  return buildNeutralScene(transport, pollutionLevel);
      case 'Green':
      default:         return buildGreenScene(transport);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Core Mounting Effect
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // SAFE GUARD: If strictmode triggers a rapid re-mount, prevent duplicate setups
    if (container.querySelector('canvas')) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      return;
    }
    
    renderer.shadowMap.enabled = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    renderer.setSize(container.clientWidth || 500, container.clientHeight || 500);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(0, 10, DEFAULT_CAMERA_DISTANCE);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    ambient.userData.type = 'ambient';
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e0, 0.9);
    sun.position.set(10, 20, 10);
    sun.userData.type = 'sun';
    scene.add(sun);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan      = false;
    controls.minDistance    = DEFAULT_CAMERA_DISTANCE * 0.5;   
    controls.maxDistance    = DEFAULT_CAMERA_DISTANCE * 2.0;   
    controls.maxPolarAngle  = Math.PI / 2;                      
    controls.enableDamping  = true;
    controls.dampingFactor  = 0.08;
    controlsRef.current = controls;

    const initialState = deriveState(score);
    const pollutionLevel = getPollutionLevel(score);
    const { group, smokeMeshes, vehicle } = buildScene(initialState, transportChoice, pollutionLevel);
    
    scene.add(group);
    activeGroupRef.current  = group;
    smokeMeshesRef.current  = smokeMeshes;
    vehicleRef.current      = vehicle;
    currentStateRef.current = initialState;
    applyEnvironmentTone(scene, initialState, pollutionLevel);

    function onResize() {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    // --- Animation Execution Framework ---
    function animate(time) {
      animIdRef.current = requestAnimationFrame(animate);

      // Smoke puff transforms
      if (smokeMeshesRef.current) {
        smokeMeshesRef.current.forEach((mesh) => {
          if (!mesh) return;
          mesh.position.y += mesh.userData.smokeSpeed;
          mesh.position.x += mesh.userData.driftX || 0;
          mesh.position.z += mesh.userData.driftZ || 0;
          const pulse = 1 + Math.sin(time * 0.0035 + (mesh.userData.pulseOffset || 0)) * 0.16;
          mesh.scale.setScalar((mesh.userData.baseScale || 1) * pulse);
          if (mesh.material.transparent) {
            mesh.material.opacity = Math.max(0, mesh.material.opacity - 0.0008);
          }
          if (mesh.position.y > mesh.userData.originY + 3) {
            mesh.position.y = mesh.userData.originY;
            mesh.position.x = mesh.userData.originX ?? mesh.position.x;
            mesh.position.z = mesh.userData.originZ ?? mesh.position.z;
            mesh.scale.setScalar(mesh.userData.baseScale || 1);
            if (mesh.material.transparent) {
              mesh.material.opacity = mesh.userData.baseOpacity ?? 0.45;
            }
          }
        });
      }

      // Wind Turbine rotation
      if (activeGroupRef.current) {
        activeGroupRef.current.traverse((child) => {
          if (child.userData.type === 'wind-turbine') {
            child.children.forEach((c) => {
              if (c.type === 'Group') c.rotation.z += 0.025;
            });
          }
        });
      }

      // Transport path progression
      if (vehicleRef.current) {
        const { group: vehicleGroup, wheels, exhaustSmokeMeshes, speed = 0.0018, amplitude = 5.2 } = vehicleRef.current;
        if (vehicleGroup) {
          const phase = time * speed;
          const directionForward = Math.sin(phase) >= 0;
          vehicleGroup.position.x = Math.sin(phase) * amplitude;
          vehicleGroup.rotation.y = directionForward ? 0 : Math.PI;
          
          if (wheels) {
            wheels.forEach((wheel) => { wheel.rotation.z -= 0.25; });
          }
          if (exhaustSmokeMeshes) {
            exhaustSmokeMeshes.forEach((mesh) => {
              mesh.position.y += mesh.userData.smokeSpeed;
              mesh.position.x += mesh.userData.driftX || 0;
              mesh.position.z += mesh.userData.driftZ || 0;
              const pulse = 1 + Math.sin(time * 0.004 + (mesh.userData.pulseOffset || 0)) * 0.13;
              mesh.scale.setScalar((mesh.userData.baseScale || 1) * pulse);
              if (mesh.material.transparent) {
                mesh.material.opacity = Math.max(0, mesh.material.opacity - 0.0012);
              }
              if (mesh.position.y > mesh.userData.originY + 1.2) {
                mesh.position.y = mesh.userData.originY;
                mesh.position.x = mesh.userData.originX ?? mesh.position.x;
                mesh.position.z = mesh.userData.originZ ?? mesh.position.z;
                mesh.scale.setScalar(mesh.userData.baseScale || 1);
                if (mesh.material.transparent) {
                  mesh.material.opacity = mesh.userData.baseOpacity ?? 0.42;
                }
              }
            });
          }
        }
      }

      // Dynamic Transition Tweener
      if (tweenRef.current) {
        const elapsed = time - tweenRef.current.start;
        const t = Math.min(elapsed / TRANSITION_MS, 1);
        const eased = easeInOut(t);

        setGroupOpacity(tweenRef.current.from, 1 - eased);
        setGroupOpacity(tweenRef.current.to,   eased);

        if (t >= 1) {
          scene.remove(tweenRef.current.from);
          disposeGroup(tweenRef.current.from);
          setGroupOpacity(tweenRef.current.to, 1);
          tweenRef.current = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    }
    animIdRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animIdRef.current);
      resizeObserver.disconnect();
      if (controlsRef.current) controlsRef.current.dispose();
      
      // Removed destructive renderer.dispose() and removeChild to safeguard 
      // the WebGL device context during hot reloads and StrictMode mounts.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // ---------------------------------------------------------------------------
  // Score Change Watcher
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || currentStateRef.current === null) return;

    const newState = deriveState(score);
    const pollutionLevel = getPollutionLevel(score);
    
    if (newState === currentStateRef.current) {
      applyEnvironmentTone(scene, newState, pollutionLevel);
      return;
    }

    if (tweenRef.current) {
      scene.remove(tweenRef.current.from);
      disposeGroup(tweenRef.current.from);
      tweenRef.current = null;
    }

    const { group: incoming, smokeMeshes: incomingSmoke, vehicle: incomingVehicle } = buildScene(newState, transportChoice, pollutionLevel);
    setGroupOpacity(incoming, 0); 
    scene.add(incoming);

    const outgoing = activeGroupRef.current;
    tweenRef.current = {
      start:   performance.now(),
      from:    outgoing,
      to:      incoming,
      toSmoke: incomingSmoke,
    };

    activeGroupRef.current  = incoming;
    smokeMeshesRef.current  = incomingSmoke;
    vehicleRef.current      = incomingVehicle;
    currentStateRef.current = newState;

    applyEnvironmentTone(scene, newState, pollutionLevel);
  }, [score, buildScene, transportChoice]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full"
      role="img"
      aria-label={`3D eco island — current state: ${deriveState(score)}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Engine Utilities
// ---------------------------------------------------------------------------
function setGroupOpacity(group, opacity) {
  if (!group) return;
  group.traverse((child) => {
    if (child.isMesh && child.material) {
      if (child.userData.type === 'smoke') return;
      child.material.transparent = opacity < 1;
      child.material.opacity     = opacity;
    }
  });
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function applyEnvironmentTone(scene, state, pollutionLevel = 0.5) {
  const baseColors = {
    Polluted: new THREE.Color(0x06121d),
    Neutral:  new THREE.Color(0x6ea8cc),
    Green:    new THREE.Color(0xb7e7ff),
  };
  const stateColors = {
    Polluted: new THREE.Color(0x1a1a2e),
    Neutral:  new THREE.Color(0x7eb8d4),
    Green:    0x87ceeb,
  };
  const toneColor = baseColors[state] ?? baseColors.Neutral;
  const brightColor = stateColors[state] ?? stateColors.Neutral;
  const backgroundColor = toneColor.clone().lerp(brightColor, 1 - pollutionLevel * 0.7);
  const ambientIntensities = {
    Polluted: 0.16 + (1 - pollutionLevel) * 0.18,
    Neutral:  0.42 + (1 - pollutionLevel) * 0.22,
    Green:    0.72 + (1 - pollutionLevel) * 0.08,
  };
  const fogDensity = {
    Polluted: 0.03 + pollutionLevel * 0.045,
    Neutral:  0.015 + pollutionLevel * 0.022,
    Green:    0.005 + pollutionLevel * 0.008,
  };

  scene.background = backgroundColor;
  scene.fog = new THREE.FogExp2(backgroundColor.getHex(), fogDensity[state] ?? fogDensity.Neutral);
  scene.traverse((child) => {
    if (child.isLight && child.userData.type === 'ambient') {
      child.intensity = ambientIntensities[state] ?? ambientIntensities.Neutral;
    }
    if (child.isLight && child.userData.type === 'sun') {
      const sunIntensity = {
        Polluted: 0.35 + (1 - pollutionLevel) * 0.15,
        Neutral:  0.7 + (1 - pollutionLevel) * 0.15,
        Green:    0.95,
      };
      child.intensity = sunIntensity[state] ?? sunIntensity.Neutral;
    }
  });
}

function disposeGroup(group) {
  if (!group) return;
  group.traverse((child) => {
    if (child.isMesh) {
      if (child.material && child.userData.type === 'smoke') {
        child.material.dispose();
      }
    }
  });
}