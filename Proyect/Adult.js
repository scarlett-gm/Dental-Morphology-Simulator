let scene, camera, renderer, controls, model;
const MODEL_PATH = 'dientesA.glb';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const movedTeeth = new Map(); // Guarda dientes ya movidos

init();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5); // posicion inicial para que se vea la cuadricula

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    setupLights();
    loadModel();

    document.addEventListener('mousedown', onMouseClick);
    window.addEventListener('resize', onWindowResize);

    animate();
}

function setupLights() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 2, 2);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffccaa, 0.5);
    pointLight.position.set(-1, 1, 1);
    scene.add(pointLight);
}

function loadModel() {
    const loader = new THREE.GLTFLoader();
    loader.load(
        MODEL_PATH,
        (gltf) => {
            model = gltf.scene;

            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(model);

            // Centrar camara
            const box = new THREE.Box3().setFromObject(model);
            const center = new THREE.Vector3();
            const size = new THREE.Vector3();
            box.getCenter(center);
            box.getSize(size);

            camera.position.copy(center);
            camera.position.z += size.z * 2;
            camera.position.y += size.y * 0.5;
            controls.target.copy(center);
            controls.update();

            document.getElementById('loading').style.display = 'none';
        },
        (xhr) => {
            const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
            document.getElementById('loading').textContent = `Cargando: ${percent}%`;
        },
        (error) => {
            console.error('Error al cargar modelo:', error);
            document.getElementById('loading').innerHTML = 'Error al cargar el modelo.';
        }
    );
}

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (!model) return;

    const intersectables = [];
    model.traverse((child) => {
        if (child.isMesh) {
            intersectables.push(child);
        }
    });

    const intersects = raycaster.intersectObjects(intersectables, true);

    if (intersects.length > 0) {
        const selected = intersects[0].object;
        const name = selected.name.toLowerCase();

        console.log('Objeto clickeado:', selected.name);

        if (name.includes('incisivo')) {
            if (!movedTeeth.has(selected)) {
                movedTeeth.set(selected, selected.position.clone());
                selected.position.z += 0.2;
            } else {
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
