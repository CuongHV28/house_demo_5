import * as THREE from 'three';

import { colors, 
  groundMaterial, 
  floorMaterial, 
  roofMaterial, 
  windowMaterial, 
  wallMaterial, 
  woodMaterial, 
  normalMaterial, 
  standartMaterial, 
  lambert, 
  phongMaterial } from './materials';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { IWallSettings } from './shapes/baseShapes';

import {
  Evaluator,
  EdgesHelper,
  Operation,
  OperationGroup,
  ADDITION,
  SUBTRACTION,
  Brush,
} from "three-bvh-csg";

import { IHouseSide } from './houses/types';
import { CSG } from 'three-csg-ts';
import { s } from 'vite/dist/node/types.d-aGj9QkWt';



// init scene
let scene = new THREE.Scene();

scene.background = new THREE.Color(colors.background);

// init camera
const isocamera = false;

let camera: THREE.OrthographicCamera | THREE.PerspectiveCamera;
//test camera
// camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.z = 5;

let cameraSettings = {
  position: new THREE.Vector3(),
  lookAt: new THREE.Vector3(),
  fov: 45,
  far: 250,
};

if (isocamera) {
  const aspect = window.innerWidth / window.innerHeight;
  const d = 20;
  camera = new THREE.OrthographicCamera(
    -d * aspect,
    d * aspect,
    d,
    -d,
    1,
    4000
  );

  camera.position.set(20, 20, 20);
  camera.rotation.order = "YXZ";
  camera.rotation.y = -Math.PI / 4;
  camera.rotation.x = Math.atan(-1 / Math.sqrt(2));
} else {
  let cameraPositionFront = {
    fov: 15,
    far: 250,
    position: new THREE.Vector3(0, 7, 60),
    lookAt: new THREE.Vector3(0, 5, 0),
  };
  let cameraPositionAngled = {
    fov: 45,
    far: 250,
    position: new THREE.Vector3(15, 15, 20),
    lookAt: new THREE.Vector3(0, 5, 0),
  };
  let cameraPositionISO = {
    fov: 15,
    far: 250,
    position: new THREE.Vector3(50, 20, 50),
    lookAt: new THREE.Vector3(0, 5, 0),
  };
  cameraSettings = cameraPositionAngled;
  camera = new THREE.PerspectiveCamera(
    cameraSettings.fov,
    window.innerWidth / window.innerHeight,
    0.1,
    cameraSettings.far
  );
  camera.position.copy(cameraSettings.position);
}


// init renderer
const canvas = document.querySelector('.webgl') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", (event) => {
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// init controls
let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;
controls.target = cameraSettings.lookAt;

// add light 
// const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
// scene.add(ambientLight);

// // Add a directional light for better illumination
// const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // white light with full intensity
// directionalLight.position.set(0, 1, 1); // adjust as needed
// scene.add(directionalLight);
// Add ambient and directional lights to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Adjust renderer settings for improved lighting effects
renderer.physicallyCorrectLights = true;
renderer.gammaFactor = 2.2;
renderer.gammaOutput = true;

// add a ground plane
const groundPlane = new THREE.Mesh(
    new THREE.CylinderGeometry(30, 30, 1, 32),
    groundMaterial
  );
groundPlane.position.y = -0.5;
groundPlane.castShadow = true;
groundPlane.receiveShadow = true;
// The ground plane is at y = -0.5, and its height is 1
const groundPlaneHeight = 1;
const groundPlaneYPosition = -0.5;
scene.add(groundPlane);


let wallWidth = 0.2;
let wallHeight = 4;
const wall1Depth = 5; // Depth of wall1
const wall2Depth = 2; // Depth of wall2
const floorThickness = 0.05; // thickness of the floor

// Define and add the floor
const floorSettings = {
  width: wall2Depth + (2 * wallWidth),
  height: wallWidth,
  depth: wall1Depth,
  material: new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide}),
  position: {
    x: (wall2Depth / 2) + wallWidth / 2,
    y: groundPlaneYPosition + (groundPlaneHeight / 2) + (floorThickness / 2)
  }
};

const floorGeometry = new THREE.BoxGeometry(floorSettings.width, floorSettings.height, floorSettings.depth);
const floor = new THREE.Mesh(floorGeometry, floorSettings.material);
floor.position.x = floorSettings.position.x;
floor.position.y = floorSettings.position.y;
scene.add(floor);

// First wall (already created)
let geometry1 = new THREE.BoxGeometry(wallWidth, wallHeight, wall1Depth);
let wall1 = new THREE.Mesh(geometry1, wallMaterial);
wall1.position.y = groundPlaneYPosition + (groundPlaneHeight / 2) + (floorThickness / 2) + (wallHeight / 2);

// Second wall - next to the first wall
let geometry2 = new THREE.BoxGeometry(wallWidth, wallHeight, wall2Depth);
let wall2 = new THREE.Mesh(geometry2, wallMaterial);
wall2.position.x = wall1.position.x + (wallWidth / 2) + (wall2Depth / 2); // Adjust based on the room's depth
wall2.position.y = groundPlaneYPosition + (groundPlaneHeight / 2) + (floorThickness / 2) + (wallHeight / 2);
wall2.position.z = -(wall1.position.z - (wall1Depth / 2) + (wallWidth / 2)); // Adjust based on the room's depth
// Rotating wall2 to be perpendicular to wall1
wall2.rotation.y = Math.PI / 2; // Rotate 90 degrees around the y-axis

// Third wall - side wall
let geometry3 = new THREE.BoxGeometry(wallWidth, wallHeight, wall1Depth); // same as wall 1
let wall3 = new THREE.Mesh(geometry3, wallMaterial);
wall3.position.y = groundPlaneYPosition + (groundPlaneHeight / 2) + (floorThickness / 2) + (wallHeight / 2);
wall3.position.x = wall2.position.x + (wall2Depth / 2) + (wallWidth / 2); // Adjust based on the room's width

// // Fourth wall - opposite side wall
let geometry4 = new THREE.BoxGeometry(wallWidth, wallHeight, wall2Depth); // Same dimensions as the 2nd wall
let wall4 = new THREE.Mesh(geometry4, wallMaterial);
wall4.position.y = groundPlaneYPosition + (groundPlaneHeight / 2) + (floorThickness / 2) + (wallHeight / 2);
wall4.position.x = wall2.position.x; 
wall4.position.z = -(wall3.position.z + (wall1Depth / 2) - (wallWidth / 2)); // Adjust based on the room's depth
// Rotating wall2 to be perpendicular to wall1
wall4.rotation.y = Math.PI / 2; // Rotate 90 degrees around the y-axis

// Add walls to the scene
scene.add(wall1);
scene.add(wall2);
scene.add(wall3);
scene.add(wall4);



// Create wall geometry
const testWallWidth = 10;
const testWallHeight = 8;
const testWallDepth = 0.5;
const wallGeometry = new THREE.BoxGeometry(10, testWallHeight, testWallDepth);
const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
wallMesh.position.set(10, 4, 5);

// Calculate the bottom of the wall based on its center position and height
const bottomOfWall = wallMesh.position.y - (testWallHeight / 2);
const testWindowHeight = 0.1 * testWallHeight;
const testWindowWidth = 0.1 * testWallWidth;

const doorHeight = 0.5 * testWallHeight;
const doorWidth = 0.5 *testWallWidth;
//draw doors and windows
// Assuming 'CSG' is a compatible library and 'wallMesh' is the mesh you want to subtract from
const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, testWallDepth);
const windowGeometry = new THREE.BoxGeometry(testWindowWidth, testWindowHeight, testWallDepth);
const doorMesh = new THREE.Mesh(doorGeometry);
const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);

const doorPositionX = 2; // Centered on the wall's X position
const doorPositionY = -(wallMesh.position.y - (wallMesh.geometry.parameters.height / 2) + (doorMesh.geometry.parameters.height / 2)); // Align bases
const doorPositionZ = 0; // Assuming the wall and door are aligned in Z

const windowPositionX = -2; // Centered on the wall's X position
const windowPositionY = wallMesh.position.y + (wallMesh.geometry.parameters.height / 2) - 1.5 - doorHeight; // This places the window above the door
const windowPositionZ = 0; // Assuming the wall and door are aligned in Z

// Create a transformation matrix for the doorMesh
let doorMatrix = new THREE.Matrix4();
doorMatrix.makeTranslation(doorPositionX, doorPositionY, doorPositionZ);

let windowMatrix = new THREE.Matrix4();
windowMatrix.makeTranslation(windowPositionX, windowPositionY, windowPositionZ);

// Apply the matrix
doorMesh.applyMatrix4(doorMatrix);
windowMesh.applyMatrix4(windowMatrix);

// Convert Three.js meshes to CSG objects
const wallCSG = CSG.fromMesh(wallMesh, );
const doorCSG = CSG.fromMesh(doorMesh, doorMatrix);
const windowCSG = CSG.fromMesh(windowMesh, windowMatrix);

// Perform the subtraction
const subtractedDoorCSG = wallCSG.subtract(doorCSG);
const subtractedWindowCSG = subtractedDoorCSG.subtract(windowCSG);

// Convert the result back to a Three.js mesh using the correct CSG object and applying the wall's matrix
const subtractedMesh = CSG.toMesh(subtractedWindowCSG, wallMesh.matrix);
subtractedMesh.material = normalMaterial; // Reapply the wall material to the new mesh

subtractedMesh.position.set(wallMesh.position.clone().y, wallMesh.position.clone().y, wallMesh.position.clone().z); // Adjust the position as needed
scene.add(subtractedMesh); // Don't forget to add the subtracted mesh to the scene


// function addHoles(wall) {
//   // Extract wall dimensions
//   const wallWidth = wall.geometry.parameters.width;
//   const wallHeight = wall.geometry.parameters.height;
//   const wallDepth = wall.geometry.parameters.depth;

//   // Calculate dimensions for door and window
//   const testWindowHeight = 0.1 * wallHeight;
//   const testWindowWidth = 0.1 * wallWidth;
//   const doorHeight = 0.5 * wallHeight;
//   const doorWidth = 0.2 * wallWidth;

//   // Create geometries for door and window
//   const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, wallDepth + 0.01);
//   const windowGeometry = new THREE.BoxGeometry(testWindowWidth, testWindowHeight, wallDepth + 0.01);

//   // Create meshes for door and window
//   const doorMesh = new THREE.Mesh(doorGeometry);
//   const windowMesh = new THREE.Mesh(windowGeometry);

//   // Position door and window relative to the wall
//   doorMesh.position.set(-wallWidth / 4, -wallHeight / 4, 0); // Example positioning
//   windowMesh.position.set(wallWidth / 4, wallHeight / 4, 0); // Example positioning

//   // Convert THREE.js meshes to CSG objects
//   const wallCSG = CSG.fromMesh(wall);
//   const doorCSG = CSG.fromMesh(doorMesh);
//   const windowCSG = CSG.fromMesh(windowMesh);

//   // Subtract door and window from the wall
//   const wallMinusDoor = wallCSG.subtract(doorCSG);
//   const finalWall = wallMinusDoor.subtract(windowCSG);

//   // Convert the final CSG back to a THREE.js mesh
//   const finalWallMesh = CSG.toMesh(finalWall, wall.matrix, wall.material);

//   return finalWallMesh;
// }
//test
// const test = addHoles(wallMesh);
// test.position.set(10, 4, 5);
// scene.add(test);

// // Step 1: Store original position and rotation
// const originalPosition = wall1.position.clone();
// const originalRotation = wall1.rotation.clone();

// // Step 2: Modify the wall
// let modifiedWall1 = addHoles(wall1.clone());

// // Step 3: Apply original position and rotation to the modified wall
// // modifiedWall1.position.copy(originalPosition);
// // modifiedWall1.rotation.copy(originalRotation);

// // Step 4: Replace in scene
// // scene.remove(wall1);
// modifiedWall1.position.set(-2, 4, 5);
// scene.add(modifiedWall1);

// Update the reference if needed
// wall1 = modifiedWall1;
// Assuming 'wall1' and 'wallMesh' refer to the same object, use 'wall1' consistently for clarity
// const leftEdgeOfWall1 = wall1.position.x - (wall1.geometry.parameters.width / 2);
// const bottomOfWall = wall1.position.y - (wall1.geometry.parameters.height / 2);
// // const testWallHeight = wall1.geometry.parameters.height; // Assuming this is defined somewhere
// // const testWallWidth = wall1.geometry.parameters.width; // Assuming this is defined somewhere
// // const testWallDepth = wall1.geometry.parameters.depth; // Assuming this is defined somewhere

// const testWindowHeight = 0.1 * wall1.geometry.parameters.height;
// const testWindowWidth = 0.1 * wall1.geometry.parameters.width;

// const doorHeight = 0.5 * testWallHeight;
// const doorWidth = 0.5 * testWallWidth;

// const doorOffsetLeft = 0.25 * testWallWidth; // Offset for the door from the left edge of the wall
// const windowOffsetLeft = 0.05 * testWallWidth; // Offset for the window from the left edge of the wall

// // Create door and window geometries
// const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, testWallDepth);
// const windowGeometry = new THREE.BoxGeometry(testWindowWidth, testWindowHeight, testWallDepth);

// // Assuming 'normalMaterial' and 'windowMaterial' are defined somewhere
// const doorMesh = new THREE.Mesh(doorGeometry, normalMaterial);
// const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);

// // Calculate positions
// const doorPositionX = leftEdgeOfWall1 + doorOffsetLeft + (doorWidth / 2);
// const doorPositionY = bottomOfWall + (doorHeight / 2);
// const doorPositionZ = 0; // Assuming the wall and door are aligned in Z

// const windowPositionX = leftEdgeOfWall1 + windowOffsetLeft + (testWindowWidth / 2);
// const windowPositionY = bottomOfWall + wall1.geometry.parameters.height - 1.5 - (testWindowHeight / 2); // Adjusted to place the window above the door
// const windowPositionZ = 0; // Assuming the wall and window are aligned in Z

// // Apply transformations
// doorMesh.position.set(doorPositionX, doorPositionY, doorPositionZ);
// windowMesh.position.set(windowPositionX, windowPositionY, windowPositionZ);

// // Convert Three.js meshes to CSG objects and perform subtraction
// const wallCSG = CSG.fromMesh(wall1);
// const doorCSG = CSG.fromMesh(doorMesh);
// const windowCSG = CSG.fromMesh(windowMesh);

// const subtractedDoorCSG = wallCSG.subtract(doorCSG);
// const subtractedWindowCSG = subtractedDoorCSG.subtract(windowCSG);

// // Convert the result back to a Three.js mesh
// const subtractedMesh = CSG.toMesh(subtractedWindowCSG, wall1.matrix, normalMaterial);

// // Correctly set the position of the subtracted mesh
// subtractedMesh.position.copy(wallMesh.position);

// // Add the subtracted mesh to the scene
// scene.add(subtractedMesh);





// add roof
// Define the vertices for the pitched roof
const vertices = new Float32Array([
  // Base of the roof
  -wall2Depth / 2 - wallWidth, 0,  wall1Depth / 2,  // Back left corner
   wall2Depth / 2 + wallWidth, 0,  wall1Depth / 2,  // Back right corner
   wall2Depth / 2 + wallWidth, 0, - wall1Depth / 2,  // Front right corner
  -wall2Depth / 2 - wallWidth, 0, -wall1Depth / 2,  // Front left corner
  // Top of the roof
  0, wallHeight / 2, 0,  // Top center point
]);

// Define the indices for the faces of the roof
const indices = new Uint16Array([
  0, 1, 4, // Back face
  1, 2, 4, // Right face
  2, 3, 4, // Front face
  3, 0, 4  // Left face
]);

// Create a buffer geometry
const roofGeometry = new THREE.BufferGeometry();
roofGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
roofGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

// Compute normals for the lighting calculations
roofGeometry.computeVertexNormals();

// const roofMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513, side: THREE.DoubleSide });
const roofMaterial = new THREE.MeshStandardMaterial({
  color: 0x8B4513,
  side: THREE.DoubleSide,
  metalness: 0.2,
  roughness: 0.5
});
const roof = new THREE.Mesh(roofGeometry, normalMaterial);
roof.position.x = wall1.position.x + (wall2Depth / 2) + (wallWidth / 2);
roof.position.y = wall1.position.y + (wallHeight / 2); // Adjust the height to sit on top of the walls
scene.add(roof);

// Step 1: Create an EdgesGeometry from the roofGeometry
const edgeGeometry = new THREE.EdgesGeometry(roofGeometry);

// Step 2: Create a LineBasicMaterial for the edges
const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }); // Use a contrasting color

// Step 3: Create LineSegments to render the edges
const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);

// Step 4: Position the edges to match the roof's position
edges.position.x = roof.position.x;
edges.position.y = roof.position.y;
edges.position.z = roof.position.z;

// Step 5: Add the edges to the scene
scene.add(edges);



function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();