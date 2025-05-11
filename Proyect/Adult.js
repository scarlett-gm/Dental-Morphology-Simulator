let scene, camera, renderer, controls, model;
const MODEL_PATH = 'consultorio.glb';

// Variables para rotación con teclado
const rotationSpeed = 0.03;
const keyboardState = {};

init();

function init() {
    // Configuración básica
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    document.body.appendChild(renderer.domElement);

    // Configurar controles de cámara
    setupCameraControls();

    // Configurar controles de teclado
    setupKeyboardControls();

    // Configurar sistema de iluminación profesional
    setupLighting();

    // Cargar modelo
    loadModel();

    window.addEventListener('resize', onWindowResize);
    animate();
}

function setupCameraControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enablePan = false;
    controls.screenSpacePanning = false;
    controls.minAzimuthAngle = -Math.PI / 2;
    controls.maxAzimuthAngle = Math.PI / 2;
    controls.minPolarAngle = Math.PI / 3;
    controls.maxPolarAngle = Math.PI / 1.8;
    
    // Desactivar damping cuando se usan teclas
    controls.addEventListener('change', () => {
        if (Object.values(keyboardState).some(state => state)) {
            controls.enableDamping = false;
        } else {
            controls.enableDamping = true;
        }
    });
}

function setupKeyboardControls() {
    // Listeners para teclado
    window.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        if (['w','a','s','d'].includes(key)) {
            keyboardState[key] = true;
        }
    });
    
    window.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        if (['w','a','s','d'].includes(key)) {
            keyboardState[key] = false;
        }
    });
}

function handleKeyboardRotation() {
    // Obtener la posición actual de la cámara relativa al target
    const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
    
    // Rotación vertical (W/S)
    if (keyboardState['w']) {
        // Rotar hacia arriba alrededor del eje X local
        offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), rotationSpeed);
    }
    if (keyboardState['s']) {
        // Rotar hacia abajo alrededor del eje X local
        offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), -rotationSpeed);
    }
    
    // Rotación horizontal (A/D)
    if (keyboardState['a']) {
        // Rotar hacia la izquierda alrededor del eje Y global
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationSpeed);
    }
    if (keyboardState['d']) {
        // Rotar hacia la derecha alrededor del eje Y global
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotationSpeed);
    }
    
    // Aplicar la nueva posición de la cámara
    camera.position.copy(controls.target).add(offset);
    
    // Asegurarse de que la cámara sigue mirando al target
    camera.lookAt(controls.target);
    
    // Actualizar los controles
    controls.update();
}

function setupLighting() {
    // 1. Luz ambiental general (suave)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // 2. Luz principal direccional (como luz de techo)
    const mainLight = new THREE.DirectionalLight(0xfff4e6, 0.8);
    mainLight.position.set(0.5, 1, 0.5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 10;
    mainLight.shadow.camera.left = -5;
    mainLight.shadow.camera.right = 5;
    mainLight.shadow.camera.top = 5;
    mainLight.shadow.camera.bottom = -5;
    mainLight.shadow.bias = -0.001;
    scene.add(mainLight);

    // 3. Luz de relleno (para reducir sombras duras)
    const fillLight = new THREE.DirectionalLight(0xccf0ff, 0.3);
    fillLight.position.set(-0.5, 0.5, -0.5);
    scene.add(fillLight);

    // 4. Luz focal (como lámpara dental)
    const spotLight = new THREE.SpotLight(0xfff9e6, 1, 10, Math.PI/6, 0.5, 1);
    spotLight.position.set(0, 1.5, 1);
    spotLight.target.position.set(0, 0.8, 0);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    scene.add(spotLight);
    scene.add(spotLight.target);

    // 5. Luces adicionales (opcional)
    const light1 = new THREE.PointLight(0xfff4e6, 0.5, 5);
    light1.position.set(1, 1.2, 1);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xe6f4ff, 0.3, 5);
    light2.position.set(-1, 1, 1);
    scene.add(light2);
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
                    
                    if (child.material) {
                        child.material.roughness = 0.3;
                        child.material.metalness = 0.1;
                    }
                }
            });
            
            scene.add(model);

            // Ajustar cámara al modelo
            const box = new THREE.Box3().setFromObject(model);
            const center = new THREE.Vector3();
            const size = new THREE.Vector3();
            box.getCenter(center);
            box.getSize(size);

            camera.position.copy(center);
            camera.position.z += size.z * 0.3;
            camera.position.y += size.y * 0.2;

            controls.target.copy(center);
            controls.target.z -= size.z * 0.1;
            
            controls.minDistance = size.length() * 0.05;
            controls.maxDistance = size.length() * 0.3;
            
            controls.update();
            document.getElementById('loading').style.display = 'none';
        },
        (xhr) => {
            const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
            document.getElementById('loading').textContent = `Cargando: ${percent}%`;
        },
        (error) => {
            console.error('Error:', error);
            document.getElementById('loading').innerHTML = `
                Error al cargar el modelo.<br>
                Verifica la consola (F12) para detalles.
            `;
        }
    );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Rotar cámara si hay teclas presionadas
    if (Object.values(keyboardState).some(state => state)) {
        handleKeyboardRotation();
    }
    
    controls.update();
    renderer.render(scene, camera);
}