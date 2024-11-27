import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui';

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Create stars
function createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000;
    const positions = new Float32Array(starsCount * 3);
    const sizes = new Float32Array(starsCount);

    for(let i = 0; i < starsCount * 3; i += 3) {
        // Random positions in a sphere
        const radius = 50;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        
        positions[i] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = radius * Math.cos(phi);

        // Random sizes
        sizes[i / 3] = Math.random() * 2;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        sizeAttenuation: true,
        size: 0.1
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

createStars();

// Ground plane (dark base with subtle grid)
const planeGeometry = new THREE.PlaneGeometry(20, 20, 20, 20);
const planeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x111111,
    side: THREE.DoubleSide,
    metalness: 0.8,
    roughness: 0.4,
    wireframe: true
});

const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2;
plane.position.y = -0.5;
scene.add(plane);

// Debug
const gui = new dat.GUI();

// Parameters
const parameters = {
    // Colors
    sunColor: '#ff6600',
    firstSphereColor: '#00ff00',
    secondSphereColor: '#0000ff',
    
    // Orbit parameters
    sphereOrbitSpeed: 0.005,
    sphereDistance: 2.5,
    sphere2OrbitSpeed: 0.003,
    sphere2Distance: 5.0,
    
    // Sun parameters
    sunIntensity: 2,
    sunGlowIntensity: 1,
    sunLightDistance: 50,
    sunGlowDistance: 30
};

// Create location marker (center sphere - now a sun)
const locationGeometry = new THREE.SphereGeometry(1.2, 32, 32);
const material = new THREE.MeshStandardMaterial({
    color: 0xff6600,
    metalness: 0,
    roughness: 0.7,
    emissive: 0xff6600,
    emissiveIntensity: 1
});

const location = new THREE.Mesh(locationGeometry, material);
location.position.y = 1;
scene.add(location);

// Add sun glow with increased range
const sunGlow = new THREE.PointLight(0xff6600, parameters.sunGlowIntensity, parameters.sunGlowDistance);
sunGlow.position.copy(location.position);
scene.add(sunGlow);

// Add sun light with increased range
const sunLight = new THREE.PointLight(0xff8833, parameters.sunIntensity, parameters.sunLightDistance);
sunLight.position.copy(location.position);
scene.add(sunLight);

// Create first orbiting sphere (planet)
const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({ 
    color: parameters.firstSphereColor,
    metalness: 0.4,
    roughness: 0.7
});

const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

// Create second sphere (planet)
const sphere2Geometry = new THREE.SphereGeometry(0.7, 32, 32);
const sphere2Material = new THREE.MeshStandardMaterial({
    color: parameters.secondSphereColor,
    metalness: 0.4,
    roughness: 0.7
});

const sphere2 = new THREE.Mesh(sphere2Geometry, sphere2Material);
scene.add(sphere2);

// Lights
// Dim ambient light for space
const ambientLight = new THREE.AmbientLight(0x222222, 0.2);
scene.add(ambientLight);

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(8, 4, 8);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.update();

// GUI Controls
// Colors folder
const colorsFolder = gui.addFolder('Colors');

colorsFolder.addColor(parameters, 'sunColor')
    .name('Sun Color')
    .onChange(() => {
        // Update sun material
        material.color.setStyle(parameters.sunColor);
        material.emissive.setStyle(parameters.sunColor);
        
        // Update lights
        sunLight.color.setStyle(parameters.sunColor);
        sunGlow.color.setStyle(parameters.sunColor);
    });

colorsFolder.addColor(parameters, 'firstSphereColor')
    .name('First Planet')
    .onChange(() => {
        // Update planet material
        sphereMaterial.color.setStyle(parameters.firstSphereColor);
        sphereMaterial.needsUpdate = true;
    });

colorsFolder.addColor(parameters, 'secondSphereColor')
    .name('Second Planet')
    .onChange(() => {
        // Update planet material
        sphere2Material.color.setStyle(parameters.secondSphereColor);
        sphere2Material.needsUpdate = true;
    });

// Sun controls
const sunFolder = gui.addFolder('Sun Controls');

sunFolder.add(parameters, 'sunIntensity')
    .min(0)
    .max(5)
    .step(0.1)
    .name('Sun Intensity')
    .onChange(() => {
        sunLight.intensity = parameters.sunIntensity;
    });

sunFolder.add(parameters, 'sunGlowIntensity')
    .min(0)
    .max(2)
    .step(0.1)
    .name('Sun Glow')
    .onChange(() => {
        material.emissiveIntensity = parameters.sunGlowIntensity;
        sunGlow.intensity = parameters.sunGlowIntensity * 2;
    });

sunFolder.add(parameters, 'sunLightDistance')
    .min(10)
    .max(100)
    .step(1)
    .name('Sun Light Reach')
    .onChange(() => {
        sunLight.distance = parameters.sunLightDistance;
    });

sunFolder.add(parameters, 'sunGlowDistance')
    .min(10)
    .max(100)
    .step(1)
    .name('Sun Glow Reach')
    .onChange(() => {
        sunGlow.distance = parameters.sunGlowDistance;
    });

// Orbit speeds folder
const orbitFolder = gui.addFolder('Orbit Controls');

orbitFolder.add(parameters, 'sphereOrbitSpeed')
    .min(0.001)
    .max(0.01)
    .step(0.001)
    .name('First Planet Speed');

orbitFolder.add(parameters, 'sphereDistance')
    .min(1)
    .max(5)
    .step(0.1)
    .name('First Planet Distance');

orbitFolder.add(parameters, 'sphere2OrbitSpeed')
    .min(0.001)
    .max(0.01)
    .step(0.001)
    .name('Second Planet Speed');

orbitFolder.add(parameters, 'sphere2Distance')
    .min(2)
    .max(8)
    .step(0.1)
    .name('Second Planet Distance');

// Animation
const clock = new THREE.Clock();
let angle = 0;
let angle2 = Math.PI;

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Update first sphere position
    angle += parameters.sphereOrbitSpeed;
    sphere.position.x = Math.cos(angle) * parameters.sphereDistance;
    sphere.position.z = Math.sin(angle) * parameters.sphereDistance;
    sphere.position.y = Math.sin(elapsedTime) * 0.2 + 0.5;

    // Update second sphere position
    angle2 += parameters.sphere2OrbitSpeed;
    sphere2.position.x = Math.sin(angle2) * parameters.sphere2Distance;
    sphere2.position.z = Math.cos(angle2) * parameters.sphere2Distance;
    sphere2.position.y = Math.cos(elapsedTime * 1.5) * 0.3 + 0.7;

    // Animate the location sphere (only vertical movement)
    location.position.y = 1 + Math.sin(elapsedTime * 2) * 0.1;

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();

// Window resize event
window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});