let scene, camera, renderer, controls, model;
const MODEL_PATH = 'ChildTeethNamed.glb';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const movedTeeth = new Map(); // Guarda dientes ya movidos
//para el cursor sobre los dientes
const tooltip = document.createElement('div');
tooltip.id = 'tooltip';
document.body.appendChild(tooltip);

const PosicionesD = {
    //Un niño tiene 20 dientes:
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
    
    // Añadir environment map
    const envMap = new THREE.CubeTextureLoader()
        .setPath('path/to/your/envmap/')
        .load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);
    envMap.encoding = THREE.sRGBEncoding;
    scene.environment = envMap;

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5); // posicion inicial para que se vea la cuadricula

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    setupLights();
    cargarModelMain(); // Dentadura completa

    //Cargamos aqui los nuevos modelos
    //cargarAdditionalModel('incisivo_11.glb', new THREE.Vector3(2, 20, 0));
    //cargarAdditionalModel('premolar.glb', new THREE.Vector3(-3, 0, 0));

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
    if (event.button !== 0) return; // Solo clic izquierdo

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
});

function setupLights() {
    // Configuración de luces centradas alrededor del modelo dental
    const modelCenter = new THREE.Vector3(0, -1.5, -3.5); // Misma posición Y que tu modelo
    const lightDistance = 5; // Distancia de las luces al centro del modelo
    const lightIntensity = 0.7; // Intensidad media
    const lightColor = 0xffffff;

    // Posiciones de las luces (coordenadas relativas al modelo)
    const lightPositions = [
        new THREE.Vector3(1, 0, 0),    // Derecha
        new THREE.Vector3(-1, 0, 0),   // Izquierda
        new THREE.Vector3(0, 0, 1),    // Frente
        new THREE.Vector3(0, 0, -1),   // Atrás
        new THREE.Vector3(0, 1, 0),    // Arriba
        new THREE.Vector3(0, -1, 0)    // Abajo (menos intensidad)
    ];

    lightPositions.forEach((pos, index) => {
        const directionalLight = new THREE.DirectionalLight(lightColor, 
            index === 5 ? lightIntensity * 0.5 : lightIntensity); // Luz inferior más suave
        
        // Posicionamos la luz relativa al centro del modelo
        directionalLight.position.copy(pos)
            .multiplyScalar(lightDistance)
            .add(modelCenter);
        
        scene.add(directionalLight);

        // DEBUG: Helpers visuales (eliminar en producción)
        //const helper = new THREE.DirectionalLightHelper(directionalLight, 1);
        //scene.add(helper);
    });

    // Luz especial desde el ángulo de la cámara (para mejor visibilidad)
    const cameraLight = new THREE.DirectionalLight(lightColor, lightIntensity * 0.8);
    cameraLight.position.set(0, 2, 3).add(modelCenter); // Posición similar a la cámara
    scene.add(cameraLight);
}

//funcion de eventos para los dientes
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

        //  Verifica si el diente esta 
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
            
            // Asegurarse que los materiales respondan bien a la luz
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material.envMapIntensity = 0.5;
                    child.material.needsUpdate = true;
                    
                    // Si quieres hacer los materiales más reflectivos
                    child.material.metalness = 0.1;
                    child.material.roughness = 0.5;
                }
            });
            
            model.position.set(0, -4.5, 0);
            scene.add(model);
            console.log("Modelo principal cargado");
            document.getElementById('loading').style.display = 'none';
        },
        undefined,
        function(error) {
            console.error("Error cargando el modelo:", error);
        }
    );
}