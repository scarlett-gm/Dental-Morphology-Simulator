let scene, camera, renderer, controls, model;
let hitbox, hitboxHelper;
let showHitboxHelper = false; // Set to true to see the hitbox helper
const MODEL_PATH = 'Recursos/ChildTeethNamed.glb';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const movedTeeth = new Map(); // saves the moved teeth positions
//for the cursor over the teeth
const tooltip = document.createElement('div');
tooltip.id = 'tooltip';
document.body.appendChild(tooltip);

const PosicionesD = {
    //A child has 20 teeth:
    "IncisivoCentralSuperior1": new THREE.Vector3(0, 0, 0.2),
    "IncisivoCentralSuperior2": new THREE.Vector3(0, 0, 0.2),
    "IncisivoCentralInferior1": new THREE.Vector3(0, 0, -0.2),
    "IncisivoCentralInferior2": new THREE.Vector3(0, 0, -0.2),
    "IncisivoLateralInferior1": new THREE.Vector3(0, 0, -0.2),
    "IncisivoLateralInferior2": new THREE.Vector3(0, 0, -0.2),
    "IncisivoLateralSuperior1": new THREE.Vector3(0, 0, 0.2),
    "IncisivoLateralSuperior2": new THREE.Vector3(0, 0, 0.2),
    "CaninoInferior1": new THREE.Vector3(0, 0, -0.2),
    "CaninoInferior2": new THREE.Vector3(0, 0, -0.2),
    "CaninoSuperior1": new THREE.Vector3(0, 0, 0.2),
    "CaninoSuperior2": new THREE.Vector3(0, 0, 0.2),
    "PrimerPremolarInferior1": new THREE.Vector3(0, 0, -0.2),
    "PrimerPremolarInferior2": new THREE.Vector3(0, 0, -0.2),
    "PrimerPremolarSuperior1": new THREE.Vector3(0, 0, 0.2),
    "PrimerPremolarSuperior2": new THREE.Vector3(0, 0, 0.2),
    "SegundoPremolarInferior1": new THREE.Vector3(0, 0, -0.2),
    "SegundoPremolarInferior2": new THREE.Vector3(0, 0, -0.2),
    "SegundoPremolarSuperior1": new THREE.Vector3(0, 0, 0.2),
    "SegundoPremolarSuperior2": new THREE.Vector3(0, 0, 0.2),
}

init();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    
    // Adding environment map
    const envMap = new THREE.CubeTextureLoader()
        .setPath('path/to/your/envmap/')
        .load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);
    envMap.encoding = THREE.sRGBEncoding;
    scene.environment = envMap;

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5); // initial position

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    setupLights();
    toggleLightHelpers(false);  //LIGHT HELPERS OFF BY DEFAULT, if you want to see them, set to true
    toggleHitboxHelper(false); // Show hitbox helper by default (off)
    cargarModelMain(); // Showing complete model

    document.addEventListener('mousedown', onMouseClick);
    window.addEventListener('resize', onWindowResize);

    animate();
    
}

document.querySelectorAll('.reset').forEach(btn => {
    btn.addEventListener('click', resetTeethPositions);
});

function resetTeethPositions() {
    movedTeeth.forEach((originalPosition, tooth) => {
        tooth.position.copy(originalPosition);
    });
    movedTeeth.clear();
}
renderer.domElement.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return; // Just left click

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
});

        
    
function setupLights() {
    // CLear existing lights and helpers
    scene.children.filter(child => child.isLight || child instanceof THREE.DirectionalLightHelper).forEach(obj => {
        scene.remove(obj);
    });

    const modelCenter = new THREE.Vector3(0, -4.5, 0);
    const lightDistance = 6;
    const mainIntensity = 0.4;

    // Array to hold lights
    const lights = [];

    // 1. Principal Lights (6 axes)
    const mainLightPositions = [
        { pos: new THREE.Vector3(1, 0.2, 0), color: 0xffffff, name: "Derecha" },
        { pos: new THREE.Vector3(-1, 0.2, 0), color: 0xffffff, name: "Izquierda" },
        { pos: new THREE.Vector3(0, 0.2, 1), color: 0xfffff, name: "Frente" },
        { pos: new THREE.Vector3(0, 0.2, -1), color: 0xffffff, name: "Atrás" },
        { pos: new THREE.Vector3(0, 1, 0.2), color: 0xffffff, name: "Arriba" },
        { pos: new THREE.Vector3(0, -0.5, 0), color: 0xffffff, name: "Abajo" }
    ];

    mainLightPositions.forEach((config, i) => {
        const light = new THREE.DirectionalLight(config.color, i === 4 ? mainIntensity * 1.2 : mainIntensity);
        light.position.copy(config.pos).multiplyScalar(lightDistance).add(modelCenter);
        light.name = config.name;
        
        if (i === 4) { // Top principal light
            light.castShadow = true;
            light.shadow.mapSize.width = 1024;
            light.shadow.mapSize.height = 1024;
        }

        scene.add(light);
        lights.push(light);

        // Helper for the light
        const helper = new THREE.DirectionalLightHelper(light, 1, 0xffffff);
        helper.name = `${config.name} Helper`;
        scene.add(helper);

        // Adding label for the light
        addLightLabel(light, config.name);
    });

    // 2. Camera Light
    const cameraLight = new THREE.DirectionalLight(0xffffff, 0.6);
    cameraLight.position.copy(camera.position);
    cameraLight.name = "Camera Light";
    scene.add(cameraLight);
    lights.push(cameraLight);

    // Helper for camera light
    const cameraLightHelper = new THREE.DirectionalLightHelper(cameraLight, 0.5);
    scene.add(cameraLightHelper);
    addLightLabel(cameraLight, "Cámara");

    // Update camera light position on camera movement
    controls.addEventListener('change', () => {
        cameraLight.position.copy(camera.position);
        cameraLightHelper.update();
        updateLightLabels();
    });

    // Function to add labels to lights
    function addLightLabel(light, text) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        context.fillStyle = 'rgba(0,0,0,0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = 'Bold 14px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText(text, canvas.width/2, canvas.height/2 + 6);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.5, 0.25, 1);
        sprite.name = `${light.name} Label`;
        light.userData.label = sprite;
        sprite.position.copy(light.position);
        scene.add(sprite);
    }

    // Function to update light labels
    function updateLightLabels() {
        lights.forEach(light => {
            if (light.userData.label) {
                light.userData.label.position.copy(light.position);
            }
        });
    }
}

// For toggling light helpers
    function toggleLightHelpers(visible) {
        scene.children.forEach(child => {
         if (child instanceof THREE.DirectionalLightHelper || 
               (child.name && child.name.includes('Label'))) {
              child.visible = visible;
             }
     });
    }

// Function to handle mouse clicks on the teeth
function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (!model) return;

    const intersectables = [];
    scene.traverse((child) => {
        if (child.isMesh) {
            intersectables.push(child);
        }
    });

    const intersects = raycaster.intersectObjects(intersectables, true);

    if (intersects.length > 0) {
        const selected = intersects[0].object;
        const dienteName = selected.name;

        //  Verifies if the clicked object is a tooth 
        if (PosicionesD[dienteName]) {
            if (!movedTeeth.has(selected)) {
                movedTeeth.set(selected, selected.position.clone());
                // Mueve el diente a la posicion deseada (relativa)
                selected.position.add(PosicionesD[dienteName]);
            } else {
                // Devuelve el diente a su posicion original
                selected.position.copy(movedTeeth.get(selected));
                movedTeeth.delete(selected);
            }
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // --- Collision camera-hitbox ---
    if (hitbox) {
        const bbox = new THREE.Box3().setFromObject(hitbox);
        // Si la cámara está dentro del cubo, la empuja hacia afuera
        if (bbox.containsPoint(camera.position)) {
            // Calcula la dirección desde el centro del cubo hacia la cámara
            const center = bbox.getCenter(new THREE.Vector3());
            const dir = camera.position.clone().sub(center).normalize();
            // Saca la cámara justo fuera del cubo
            const safePos = center.clone().add(dir.multiply(bbox.getSize(new THREE.Vector3())).multiplyScalar(0.55));
            camera.position.copy(safePos);
        }
    }

    renderer.render(scene, camera);
}

renderer.domElement.addEventListener('pointermove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersectables = [];
    scene.traverse(child => {
        if (child.isMesh && child.name && child.name !== '') {
            intersectables.push(child);
        }
    });

    const intersects = raycaster.intersectObjects(intersectables, true);

    if (intersects.length > 0) {
        const hovered = intersects[0].object;
        if (hovered.name && hovered.name !== '') {
            tooltip.style.display = 'block';
            tooltip.style.left = `${event.clientX + 15}px`;
            tooltip.style.top = `${event.clientY + 15}px`;
            
            // Puedes personalizar los nombres que se muestran aquí
            const displayName = hovered.name.replace(/([A-Z])/g, ' $1').trim();
            tooltip.textContent = displayName;
        }
    } else {
        tooltip.style.display = 'none';
    }
});

renderer.domElement.addEventListener('pointerout', () => {
    tooltip.style.display = 'none';
});

function cargarModelMain() {
    const loader = new THREE.GLTFLoader();
    loader.load(
        MODEL_PATH,
        function(gltf) {
            model = gltf.scene;
            
            // Make sure the model is scaled and positioned correctly
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material.envMapIntensity = 0.5;
                    child.material.needsUpdate = true;
                    
                    // Set this to make the model look more reflective
                    child.material.metalness = 0.1;
                    child.material.roughness = 0.5;
                }
            });
            
            model.position.set(3.5, -5, -1);
            scene.add(model);

            // --- HITBOX ---
            // Calculates the model bounding box
            const bbox = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            bbox.getSize(size);
            bbox.getCenter(center);

            // Creates the invisible cube (hitbox)
            const scale = 1.30; // 30% bigger than the model
            const geometry = new THREE.BoxGeometry(size.x * scale, size.y * scale, size.z * scale);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, visible: false });
            hitbox = new THREE.Mesh(geometry, material);
            hitbox.position.copy(center);
            hitbox.raycast = () => {}; // Makes the hitbox not interact with raycasting
            scene.add(hitbox);

            // Visual helper for the hitbox
            hitboxHelper = new THREE.BoxHelper(hitbox, 0xff0000);
            hitboxHelper.visible = showHitboxHelper;
            scene.add(hitboxHelper);

            console.log("Modelo principal cargado");
            document.getElementById('loading').style.display = 'none';
        },
        undefined,
        function(error) {
            console.error("Error cargando el modelo:", error);
        }
    );
}

// Function to select a tooth by its name
function selectToothByName(toothName) {
    if (!model) return;

    let foundTooth = null;
    model.traverse(child => {
        if (child.isMesh && child.name === toothName) {
            foundTooth = child;
        }
    });

    if (foundTooth) {
        // If the tooth has not been moved, it moves to the desired position
        if (!movedTeeth.has(foundTooth)) {
            movedTeeth.set(foundTooth, foundTooth.position.clone());
            foundTooth.position.add(PosicionesD[toothName]);
        } else {
            // If the tooth has been moved, it returns to its original position
            foundTooth.position.copy(movedTeeth.get(foundTooth));
            movedTeeth.delete(foundTooth);
        }
        // Centers the camera on the selected tooth
        /*const bbox = new THREE.Box3().setFromObject(foundTooth);
        const center = bbox.getCenter(new THREE.Vector3());
        controls.target.copy(center);
        camera.position.copy(center.clone().add(new THREE.Vector3(0, 0, 5)));*/
    } else {
        console.warn(`Diente ${toothName} no encontrado en el modelo`);
    }
}

function toggleHitboxHelper(show) {
    showHitboxHelper = show;
    if (hitboxHelper) hitboxHelper.visible = show;
    if (hitbox) hitbox.material.visible = show;
}
// Example: toggleHitboxHelper(true) for showing, toggleHitboxHelper(false) for hiding

// Listener fotr the tooth selection options
document.querySelectorAll('.tooth-option').forEach(option => {
    option.addEventListener('click', function () {
        const toothName = this.getAttribute('data-tooth');
        selectToothByName(toothName);

        // Highlight the selected tooth option
        document.querySelectorAll('.tooth-option').forEach(opt => {
            opt.classList.remove('active');
        });
        this.classList.add('active');
    });
});

// Event for the "Regresar" button
const btnRegresar = document.querySelector('.btn.regresar');
if (btnRegresar) {
    btnRegresar.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}
