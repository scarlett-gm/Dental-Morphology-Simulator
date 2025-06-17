let scene, camera, renderer, controls, model,sound;

const MODEL_PATH = 'AnasRoom.glb';

const rotationSpeed = 0.03;
const keyboardState = {};

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

init();

function init() {
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

    setupCameraControls();
    setupKeyboardControls();
    setupLighting();
     setupAudio(); 
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
    
    controls.addEventListener('change', () => {
        if (Object.values(keyboardState).some(state => state)) {
            controls.enableDamping = false;
        } else {
            controls.enableDamping = true;
        }
    });
}

function setupKeyboardControls() {
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
    const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
    
    if (keyboardState['w']) {
        offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), rotationSpeed);
    }
    if (keyboardState['s']) {
        offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), -rotationSpeed);
    }
    if (keyboardState['a']) {
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationSpeed);
    }
    if (keyboardState['d']) {
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotationSpeed);
    }
    
    camera.position.copy(controls.target).add(offset);
    camera.lookAt(controls.target);
    controls.update();
}

function setupLighting() {
    
    const ambientLight = new THREE.AmbientLight(0xfff4e6, 0.25);
    scene.add(ambientLight);

    
    const mainLight = new THREE.DirectionalLight(0xfff9e6, 1.2);
    mainLight.position.set(2, 3, 1); // Posición más alta y lateral
    mainLight.castShadow = true;
    
    // Configuración avanzada de sombras
    mainLight.shadow.mapSize.width = 4096;
    mainLight.shadow.mapSize.height = 4096;
    mainLight.shadow.camera.near = 0.2;
    mainLight.shadow.camera.far = 15;
    mainLight.shadow.camera.left = -7;
    mainLight.shadow.camera.right = 7;
    mainLight.shadow.camera.top = 7;
    mainLight.shadow.camera.bottom = -7;
    mainLight.shadow.bias = -0.0001;
    mainLight.shadow.normalBias = 0.05;
    scene.add(mainLight);

    // 3. Luz de relleno (azul fría para contraste)
    const fillLight = new THREE.DirectionalLight(0xccf0ff, 0.35);
    fillLight.position.set(-1, 0.5, -1);
    scene.add(fillLight);

    // 4. Spotlight principal (para la silla dental)
    const dentalSpot = new THREE.SpotLight(0xffffff, 2.5, 8, Math.PI/6, 0.4, 1);
    dentalSpot.position.set(0, 2, 1.5); 
    dentalSpot.target.position.set(0, 0.8, 0); 
    dentalSpot.castShadow = true;
    dentalSpot.shadow.mapSize.width = 2048;
    dentalSpot.shadow.mapSize.height = 2048;
    dentalSpot.shadow.camera.near = 0.5;
    dentalSpot.shadow.camera.far = 10;
    scene.add(dentalSpot);
    scene.add(dentalSpot.target);

    // 5. Luces de ambiente (puntuales)
    const light1 = new THREE.PointLight(0xfff4e6, 0.8, 4);
    light1.position.set(1.2, 1.5, 1);
    light1.decay = 2;
    scene.add(light1);

    const light2 = new THREE.PointLight(0xe6f4ff, 0.6, 4);
    light2.position.set(-1.2, 1.2, 1);
    light2.decay = 2;
    scene.add(light2);

    // 6. Luz de área para iluminación general
    const areaLight = new THREE.RectAreaLight(0xfff9e6, 1.5, 3, 3);
    areaLight.position.set(0, 2.5, -1);
    areaLight.rotation.x = Math.PI / 2;
    scene.add(areaLight);

    // 7. Hemisphere light para ambiente más natural
    const hemisphereLight = new THREE.HemisphereLight(
        0xfff4e6, // Color cielo (cálido)
        0x1a2b40, // Color tierra (frío)
        0.4 // Intensidad
    );
    scene.add(hemisphereLight);

    // 8. Luz de emergencia (roja tenue)
    const emergencyLight = new THREE.PointLight(0xff0000, 0.3, 3);
    emergencyLight.position.set(0, 2.3, -1.8);
    scene.add(emergencyLight);
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
            startDialog(); 
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

    // Detección de clic izquierdo sobre una zona específica
    renderer.domElement.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            const intersected = intersects[0].object;

            if (intersected.name === "Anas") {
                
               // Guardar estado actual antes de cambiar
    history.pushState({ from3DScene: true }, '', window.location.href);
    
    // Ir a Adult.html
    window.location.href = 'Adult.html';
            } else {
                console.log("Clic en:", intersected.name);
            }
        }
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (Object.values(keyboardState).some(state => state)) {
        handleKeyboardRotation();
    }

    controls.update();
    renderer.render(scene, camera);
}

function setupAudio() {
    // Crear listener y añadirlo a la cámara
    const listener = new THREE.AudioListener();
    camera.add(listener);

    // Crear audio
    const sound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();
    
    // Cargar y configurar el sonido
    audioLoader.load('Recursos/Dentist-Office-Soundscape.mp3', function(buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.5); // Volumen inicial al 50%
        sound.play();
        
        // Actualizar elementos de control
        updateAudioControls(sound);
    });

    // Configurar controles de audio
    function updateAudioControls(audio) {
        const toggleBtn = document.getElementById('toggle-audio');
        const volumeSlider = document.getElementById('volume-slider');
        
        if (toggleBtn) {
            toggleBtn.textContent = audio.isPlaying ? '🔊' : '🔇';
            toggleBtn.classList.toggle('playing', audio.isPlaying);
        }
        
        if (volumeSlider) {
            volumeSlider.value = audio.getVolume() * 100;
        }
    }

    // Control de encendido/apagado
    const toggleBtn = document.getElementById('toggle-audio');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            if (sound.isPlaying) {
                sound.pause();
            } else {
                sound.play();
            }
            updateAudioControls(sound);
        });
    }

    // Control de volumen
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            sound.setVolume(this.value / 100);
            updateAudioControls(sound);
        });
    }

    // Manejar errores
    audioLoader.load('Recursos/Dentist-Office-Soundscape.mp3', 
        () => {}, // Éxito ya manejado
        () => console.log('Cargando audio...'),
        (error) => {
            console.error('Error al cargar el audio:', error);
            const errorElement = document.getElementById('audio-error');
            if (errorElement) {
                errorElement.textContent = 'Error al cargar el audio';
                errorElement.style.display = 'block';
            }
        }
    );

    return sound;
}
    

    const dialogMessages = [
    "¡Hola! Bienvenido al consultorio.",
    "Aquí realizamos controles dentales regulares.",
    "Haz clic en los objetos para obtener más información."
    ];

let dialogIndex = 0;
const dialogBox = document.getElementById('dialog-box');
const messageBox = document.getElementById('message-box');

function startDialog() {
  dialogBox.style.display = 'flex';
  dialogIndex = 0;
  showDialogLine();
}

function showDialogLine() {
  messageBox.textContent = dialogMessages[dialogIndex];
}

function advanceDialog() {
  if (dialogIndex < dialogMessages.length - 1) {
    dialogIndex++;
    showDialogLine();
  } else {
    dialogBox.style.display = 'none';
  }
}

window.addEventListener('keydown', function (e) {
  if (e.key === "Enter" && dialogBox.style.display === 'flex') {
    advanceDialog();
  }
});




















































