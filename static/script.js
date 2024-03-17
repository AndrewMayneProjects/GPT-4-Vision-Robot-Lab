// Set up the scene, camera, and renderer
let itemFound = false;
let searchAttempts;
let robotHUDViewEnabled = true;
let messagesViewEnabled = true;
let telemetryEnabled = true;
let robotView = false;
let sceneObjects = ["Mug", "Butter", "Toaster", "Robot"];
let collisionEvent;


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 800 / 600, 0.1, 1000);
camera.position.set(10, 10, 10);
camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(800, 600);
document.getElementById("container").appendChild(renderer.domElement);

// Enable zooming and panning with the mouse
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 5;
controls.maxDistance = 50;

// // Create the grid floor
const gridSize = 8;
const gridDivisions = 6;
const gridHelper = new THREE.GridHelper(
  gridSize,
  gridDivisions,
  0xffffff,
  0xffffff,
);
scene.add(gridHelper);


// Robot View Toggle
document
  .getElementById("robotViewToggle")
  .addEventListener("click", function () {
    robotHUDViewEnabled = !robotHUDViewEnabled;
    document.getElementById("robotCamera").style.display = robotHUDViewEnabled
      ? "block"
      : "none";
  });

// robotMessagesToggle
document
  .getElementById("robotMessagesToggle")
  .addEventListener("click", function () {
    messagesViewEnabled = !messagesViewEnabled;
    document.getElementById("messages").style.display = messagesViewEnabled
      ? "block"
      : "none";
  });

// robotTelemetryToggle
document
  .getElementById("robotTelemetryToggle")
  .addEventListener("click", function () {
    telemetryEnabled = !telemetryEnabled;
    document.getElementById("telemetry").style.display = telemetryEnabled
      ? "block"
      : "none";
  });

// Robot POV Toggle
document
  .getElementById("switchViewToggle")
  .addEventListener("click", function () {
    robotView = !robotView;
    if (robotView) {
      // Show the robot POV in the main view
      // document.getElementById('container').style.display = 'none';
      document.getElementById("robotCamera").style.display = "block";
      document.getElementById("robotCamera").style.width = "800px";
      document.getElementById("robotCamera").style.height = "600px";
      document.getElementById("robotCamera").style.left = "0px";
      document.getElementById("robotCamera").style.bottom = "0px";

      // Adjust robot camera renderer
      robotRenderer.setSize(800, 600);
    } else {
      // Show the main view
      // document.getElementById('container').style.display = 'block';
      document.getElementById("robotCamera").style.width = "200px";
      document.getElementById("robotCamera").style.height = "150px";
      document.getElementById("robotCamera").style.right = "20px";
      document.getElementById("robotCamera").style.left = "";
      document.getElementById("robotCamera").style.bottom = "20px";

      // Adjust robot camera renderer
      robotRenderer.setSize(200, 150);
    }
  });

// Add cardinal direction labels to the plane
const loader = new THREE.FontLoader();
const labelDistance = 6;

loader.load(
  "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
  function (font) {
    const textMaterial = new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(createTextCanvas("N", font)),
      sizeAttenuation: false,
    });
    const textSprite = new THREE.Sprite(textMaterial);
    textSprite.scale.set(0.5, 0.5, 1);
    textSprite.position.set(0, 0.1, -labelDistance);
    scene.add(textSprite);
  }
);

loader.load(
  "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
  function (font) {
    const textMaterial = new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(createTextCanvas("S", font)),
      sizeAttenuation: false,
    });
    const textSprite = new THREE.Sprite(textMaterial);
    textSprite.scale.set(0.5, 0.5, 1);
    textSprite.position.set(0, 0.1, labelDistance);
    scene.add(textSprite);
  }
);

loader.load(
  "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
  function (font) {
    const textMaterial = new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(createTextCanvas("W", font)),
      sizeAttenuation: false,
    });
    const textSprite = new THREE.Sprite(textMaterial);
    textSprite.scale.set(0.5, 0.5, 1);
    textSprite.position.set(-labelDistance, 0.1, 0);
    scene.add(textSprite);
  }
);

loader.load(
  "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
  function (font) {
    const textMaterial = new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(createTextCanvas("E", font)),
      sizeAttenuation: false,
    });
    const textSprite = new THREE.Sprite(textMaterial);
    textSprite.scale.set(0.5, 0.5, 1);
    textSprite.position.set(labelDistance, 0.1, 0);
    scene.add(textSprite);
  }
);

// Helper function to create a canvas texture from text
function createTextCanvas(text, font) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const size = 300;
  canvas.width = size;
  canvas.height = size;
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `50px Helvetica`;
  context.fillText(text, size / 2, size / 2);
  return canvas;
}

// Robot's POV camera
const robotCameraFOV = 100;
const robotCameraAspect = 200 / 150; // Adjust the aspect ratio to fit inside the main view
const robotCameraNear = 0.1;
const robotCameraFar = 1000;
const robotCamera = new THREE.PerspectiveCamera(
  robotCameraFOV,
  robotCameraAspect,
  robotCameraNear,
  robotCameraFar
);
const robotViewWidth = 200; // Adjust the width of the robot's view
const robotViewHeight = 150; // Adjust the height of the robot's view
const robotRenderer = new THREE.WebGLRenderer();

robotRenderer.setSize(robotViewWidth, robotViewHeight);
document.getElementById("robotCamera").appendChild(robotRenderer.domElement);

// Load the robot GLB model
let robot;
const gltfLoader = new THREE.GLTFLoader();
let robotScale = 3;
gltfLoader.load("static/objects/robot.glb", function (gltf) {
  robot = gltf.scene;
  robot.scale.set(robotScale, robotScale, robotScale);
  robot.position.y = robotScale / 2;

  robot.position.x = -2;
  robot.position.z = -2;

  // robot.position.set(4, 0.5, 2);
  // Attach the robot camera to the robot
  robot.add(robotCamera);
  // Robot camera position variables
  const robotCameraX = 0.4;
  const robotCameraY = 0;
  const robotCameraZ = 0;
  robotCamera.position.set(robotCameraX, robotCameraY, robotCameraZ);

  // Make the robot camera parallel to the ground
  robotCamera.rotation.x = 0;
  robotCamera.rotation.y = Math.PI / -2;
  robot.name = "Robot";
  scene.add(robot);
});

// Load the butter GLB model
let butter;
const butterScale = 2;
gltfLoader.load("static/objects/butter.glb", function (gltf) {
  butter = gltf.scene;
  butter.scale.set(butterScale, butterScale, butterScale);
  butter.position.set(3.2, 0.4, 3); // Position the butter
  butter.name = "Butter";
  scene.add(butter);
  createDragControls();
});

let mug;
const mugScale = 15;
gltfLoader.load("static/objects/mug.glb", function (gltf) {
  mug = gltf.scene;
  mug.scale.set(mugScale, mugScale, mugScale);
  mug.position.set(-3, 0.75, 1); // Position the mug
  mug.name = "Mug";
  scene.add(mug);
  createDragControls();
});

let toaster;
const toasterScale = 15;
gltfLoader.load("static/objects/toaster.glb", function (gltf) {
  toaster = gltf.scene;
  toaster.scale.set(toasterScale, toasterScale, toasterScale);
  toaster.position.set(2.5, 0, -3); // Position the mug
  toaster.name = "Toaster";
  scene.add(toaster);
  createDragControls();
});

let dragControlsCreated = false;

function createDragControls() {
  if (!dragControlsCreated && butter && mug) {
    // Make objects draggable
    const dragControls = new THREE.DragControls(
      [butter, mug], // Array of draggable objects
      camera,
      renderer.domElement
    );

    dragControls.addEventListener("dragstart", function (event) {
      controls.enabled = false; // Disable orbit controls while dragging
    });

    dragControls.addEventListener("dragend", function (event) {
      controls.enabled = true; // Enable orbit controls after dragging
    });

    dragControlsCreated = true;
  }
}

function checkCollision(object1, object2) {
  const box1 = new THREE.Box3().setFromObject(object1);
  const box2 = new THREE.Box3().setFromObject(object2);
  return box1.intersectsBox(box2);
}

// Add an Ambient Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);

// soft white light
scene.add(ambientLight);

// Add a Directional Light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);

// Position the light
scene.add(directionalLight);

function getDirectionLabel(rotation) {
  const directions = ["East", "North", "West", "South"];
  let index = Math.round(rotation / (Math.PI / 2)) % 4;

  // console.log(index);
  if (index == -1) {
    index = 3;
  }
  return directions[index];
}

// Function to animate robot movement
function moveRobotTo(newPosition, direction) {

  return new Promise((resolve, reject) => {
    const duration = 1000; // Movement duration in milliseconds
    const start = { x: robot.position.x, z: robot.position.z };
    const end = { x: newPosition.x, z: newPosition.z };
    const tween = new TWEEN.Tween(start)
      .to(end, duration)
      .onUpdate(function () {
        robot.position.x = start.x;
        robot.position.z = start.z;
      })
      .onComplete(() => {
        resolve(); // Resolve the promise when the animation completes
      })
      .start();

    // Rotate robot to face direction of travel
    switch (direction) {
      case "n":
        robot.rotation.y = Math.PI / 2;
        break;
      case "s":
        robot.rotation.y = -Math.PI / 2;
        break;
      case "w":
        robot.rotation.y = Math.PI;
        break;
      case "e":
        robot.rotation.y = 0;
        break;
    }

    document.getElementById("telemetryData").value =
      "Bot is facing " + getDirectionLabel(robot.rotation.y);
    document.getElementById("telemetry").innerText =
      "Bot is facing " + getDirectionLabel(robot.rotation.y);
  });
}

// D-pad Controls
document.getElementById("upBtn").addEventListener("click", function () {
  moveRobotTo({ x: robot.position.x, z: robot.position.z - 1 }, "n");
});
document.getElementById("downBtn").addEventListener("click", function () {
  moveRobotTo({ x: robot.position.x, z: robot.position.z + 1 }, "s");
});
document.getElementById("leftBtn").addEventListener("click", function () {
  moveRobotTo({ x: robot.position.x - 1, z: robot.position.z }, "w");
});
document.getElementById("rightBtn").addEventListener("click", function () {
  moveRobotTo({ x: robot.position.x + 1, z: robot.position.z }, "e");
});

// Process instructions from input box
document
  .getElementById("instructions")
  .addEventListener("change", function (event) {
    const instructions = event.target.value.toLowerCase().split(",");
    moveRobot(instructions);
  });

async function moveRobot(instructions) {
  let currentPosition = { x: robot.position.x, z: robot.position.z };
  for (const instruction of instructions) {
    // console.log("instruction:", instruction)

    switch (instruction) {
      case "n":
        currentPosition.z -= 1;
        break;
      case "s":
        currentPosition.z += 1;
        break;
      case "w":
        currentPosition.x -= 1;
        break;
      case "e":
        currentPosition.x += 1;
        break;
    }

 
    await moveRobotTo(currentPosition, instruction);
    
  }
}

// Render loop
let collisionDetected = false;

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();
  renderer.render(scene, camera);
  robotRenderer.render(scene, robotCamera);

  // Check collision with all objects in the scene
  scene.traverse(function (object) {
    if (object == undefined || !sceneObjects.includes(object.name)) {
      return;
    }

    if (object !== robot && !object.isMesh && !collisionDetected) {
      // if (object !== robot && object.isMesh && !collisionDetected) {
      if (checkCollision(robot, object)) {
        // Collision detected, trigger the event
        if (sceneObjects.includes(object.name)) {
          if (object.name !== collisionEvent) {
            collisionEvent = object.name;
            console.log(`Robot touched the ${object.name}!`);
            collisionDetected = true;
            document.getElementById(
              "messages"
            ).innerText = `Bot: I found the ${object.name}!`;
            document.getElementById("telemetryData").value +=
              " | Bot touched " + object.name;
          }
        }
      }
    }
  });

  collisionDetected = false; // Reset collision flag for the next frame
}

// Array to store the captured data (images and text)
let capturedData = [];
let previous_directions = "";
let previous_explanation = "";
let previous_user_instruction = "";
let previous_direction = "";

// Capture Image Button
document.getElementById("sendButton").addEventListener("click", function () {
  getInstructions();
});

async function getInstructions() {
  capturedData = [];
  previous_direction = "";

  // document.getElementById("messages").innerText = "Bot: Searching...";

  itemFound = false;

  document.getElementById("searchAttempts").value -= 1;
  if (document.getElementById("searchAttempts").value < 0) {
    document.getElementById("searchAttempts").value = 0;
  }

  searchAttempts = parseInt(document.getElementById("searchAttempts").value);

  // Create an offscreen canvas with the desired dimensions
  const offscreenCanvas = new OffscreenCanvas(800, 600);
  const offscreenContext = offscreenCanvas.getContext("2d");

  // Render the main view onto the offscreen canvas
  renderer.render(scene, camera);
  offscreenContext.drawImage(renderer.domElement, 0, 0);

  // Add timestamp to the offscreen canvas
  const timestamp = new Date().toLocaleString();
  offscreenContext.font = "16px Arial";
  offscreenContext.fillStyle = "white";
  offscreenContext.fillText(`Timestamp: ${timestamp}`, 10, 30);

  offscreenContext.font = "16px Arial";
  offscreenContext.fillStyle = "white";
  if (previous_direction != "") {
    offscreenContext.fillText(
      `Previous directions: ${previous_direction}`,
      10,
      90
    );
  }

  const robotDirection = getDirectionLabel(robot.rotation.y);

  // Add robot direction to the offscreen canvas
  // offscreenContext.fillText(`Robot Facing: ${robotDirection}`, 10, 60);

  if (robotHUDViewEnabled) {
    // Render the robot view onto the offscreen canvas
    robotRenderer.render(scene, robotCamera);
    const robotViewWidth = robotView ? 800 : 200;
    const robotViewHeight = robotView ? 600 : 150;
    const robotViewX = robotView ? 0 : 800 - robotViewWidth - 20;
    const robotViewY = robotView ? 0 : 20;

    // Draw a border around the robot view
    offscreenContext.strokeStyle = "white";
    offscreenContext.lineWidth = 2;

    offscreenContext.drawImage(
      robotRenderer.domElement,
      robotViewX,
      robotViewY,
      robotViewWidth,
      robotViewHeight
    );

    offscreenContext.strokeRect(
      robotViewX,
      robotViewY,
      robotViewWidth,
      robotViewHeight
    );

    // Set the style for the label
    offscreenContext.fillStyle = "white"; // Text color
    offscreenContext.font = "14px Arial"; // Text size and font
    // Calculate the position for the text to be centered
    const text = "Robot POV";
    const textWidth = offscreenContext.measureText(text).width;
    const textX = robotViewX + (robotViewWidth - textWidth) / 2;
    const textY = robotViewY + 20; // 20 pixels from the top border inside the rectangle

    // Draw the label text
    offscreenContext.fillText(text, textX, textY);
  }


  offscreenContext.strokeStyle = "white";
  offscreenContext.lineWidth = 2;
  // offscreenContext.strokeRect(robotImageX, robotImageY, robotImageWidth, robotImageHeight);
  // offscreenContext.drawImage(robotImage, robotImageX, robotImageY, robotImageWidth, robotImageHeight);

  // Add a label for the robot image
  offscreenContext.fillStyle = "white";
  offscreenContext.font = "16px Arial";
  //  offscreenContext.fillText('Robot Image', robotImageX + 5, robotImageY + 17);

  // Convert the offscreen canvas to a data URL
  const dataURL = offscreenCanvas.convertToBlob().then((blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    return new Promise((resolve) => {
      reader.onloadend = () => {
        resolve(reader.result);
      };
    });
  });

  let captureText = document.getElementById("captureText").value;
  const loader = document.querySelector(".loader");
  const sendButton = document.getElementById("sendButton");

  // Show the loader and hide the send button
  loader.hidden = false;
  sendButton.hidden = true;

  if (telemetryEnabled) {
    captureText += "\n" + document.getElementById("telemetryData").value;
  }

  const data = {
    image: await dataURL,
    text: captureText,
    //  previous_user_instruction: previous_user_instruction,
    // previous_directions: previous_directions,
    //  previous_explanation: previous_explanation,
  };

  previous_user_instruction = captureText;

  capturedData.push(data);

  // console.log("capturedData:", capturedData);

  if (capturedData.length > 4) {
    capturedData.shift();
  }

  try {
    const response = await fetch("/robot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(capturedData), // Include both the image and the prompt in the request body
    });

    if (response.ok) {
      const data = await response.json();
      // console.log("Success:", data);
      // Handle success (e.g., display a message or process returned data)

      directions = data.directions.join(",").toLowerCase();
      console.log(directions);

      previous_explanation += "\n\nBot explanation: " + data.explanation;
      previous_directions += "\n\nPrevious movement: " + data.directions;
      previous_direction = data.directions;

      document.getElementById("instructions").value = data.directions;
      document.getElementById("messages").innerText =
        "Bot: " + data.explanation;

      console.log("Directions:", data.directions);
      await moveRobot(data.directions);

      // Wait for animation to finish
      if (searchAttempts > 0 && itemFound == false) {
        getInstructions();
      }

      // document.getElementById("explanation").innerText = data.explanation;
    } else {
      console.error("Error uploading image and prompt:", response.status);
    }
  } catch (error) {
    console.error("Error uploading image and prompt:", error);
  } finally {
    // Hide the loader and show the send button
    loader.hidden = true;
    sendButton.hidden = false;
  }
}

animate();
