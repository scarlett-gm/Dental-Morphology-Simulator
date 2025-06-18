let scene, camera, renderer, controls, model;
const MODEL_PATH = 'Recursos/TeethwRoots.glb';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const movedTeeth = new Map(); // Guarda dientes ya movidos
//para el cursor sobre los dientes
const tooltip = document.createElement('div');
tooltip.id = 'tooltip';
document.body.appendChild(tooltip);

const PosicionesD = {
    "IncisivoCentralSuperior1": new THREE.Vector3(0, 0, 0.8),
    "IncisivoCentralSuperior2": new THREE.Vector3(0, 0, 0.8),
    "IncisivoCentralInferior1": new THREE.Vector3(0, 0, -0.8),
    "IncisivoCentralInferior2": new THREE.Vector3(0, 0, -0.8),
    "IncisivoLateralInferior1": new THREE.Vector3(0, 0, -0.8),
    "IncisivoLateralInferior2": new THREE.Vector3(0, 0, -0.8),
    "IncisivoLateralSuperior1": new THREE.Vector3(0, 0, 0.8),
    "IncisivoLateralSuperior2": new THREE.Vector3(0, 0, 0.8),
    "CaninoInferior1": new THREE.Vector3(0, 0, -0.8),
    "CaninoInferior2": new THREE.Vector3(0, 0, -0.8),
    "CaninoSuperior1": new THREE.Vector3(0, 0, 0.8),
    "CaninoSuperior2": new THREE.Vector3(0, 0, 0.8),
    "PrimerPremolarInferior1": new THREE.Vector3(0, 0, -0.8),
    "PrimerPremolarInferior2": new THREE.Vector3(0, 0, -0.8),
    "PrimerPremolarSuperior1": new THREE.Vector3(0, 0, 0.8),
    "PrimerPremolarSuperior2": new THREE.Vector3(0, 0, 0.8),
    "SegundoPremolarInferior1": new THREE.Vector3(0, 0, -0.8),
    "SegundoPremolarInferior2": new THREE.Vector3(0, 0, -0.8),
    "SegundoPremolarSuperior1": new THREE.Vector3(0, 0, 0.8),
    "SegundoPremolarSuperior2": new THREE.Vector3(0, 0, 0.8),
    "PrimerMolarInferior1": new THREE.Vector3(0, 0, -0.8),
    "PrimerMolarInferior2": new THREE.Vector3(0, 0, -0.8),   
    "PrimerMolarSuperior1": new THREE.Vector3(0, 0, 0.8),
    "PrimerMolarSuperior2": new THREE.Vector3(0, 0, 0.8),
    "SegundoMolarInferior1": new THREE.Vector3(0, 0, -0.8),
    "SegundoMolarInferior2": new THREE.Vector3(0, 0, -0.8),
    "SegundoMolarSuperior1": new THREE.Vector3(0, 0, 0.8),
    "SegundoMolarSuperior2": new THREE.Vector3(0, 0, 0.8),
    "TercerMolarInferior1": new THREE.Vector3(0, 0, -0.8),
    "TercerMolarInferior2": new THREE.Vector3(0, 0, -0.8),
    "TercerMolarSuperior1": new THREE.Vector3(0, 0, 0.8),
    "TercerMolarSuperior2": new THREE.Vector3(0, 0, 0.8),
}

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

//funcion para movilidad por teclado

window.addEventListener('keydown', (event) => {
    const step = 0.2; // Ajusta la velocidad de movimiento

    switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            camera.position.z -= step;
            break;
        case 's':
            case 'arrowdown':
            camera.position.z += step;
            break;
        case 'a':
        case 'arrowleft':
            camera.position.x -= step;
            break;
        case 'd':
            case 'arrowright':
            camera.position.x += step;
            break;
    }
});

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
            // Centra el modelo en el origen
            model.position.set(0, -4.5, 0); // Cambia estos valores según necesites
            scene.add(model);
            console.log("Modelo principal cargado");

            // Oculta el mensaje de carga
            document.getElementById('loading').style.display = 'none';
        },
        undefined,
        function(error) {
            console.error("Error cargando el modelo:", error);
        }
    );
}

//funcion para darle funcinalidad a la barra lateral
function selectToothByName(toothName) {
    if (!model) return;

    let foundTooth = null;
    model.traverse(child => {
        if (child.isMesh && child.name === toothName) {
            foundTooth = child;
        }
    });

    if (foundTooth) {
        // Si el diente no ha sido movido, lo mueve y guarda su posicion original
        if (!movedTeeth.has(foundTooth)) {
            movedTeeth.set(foundTooth, foundTooth.position.clone());
            foundTooth.position.add(PosicionesD[toothName]);
        } else {
            // Si ya fue movido, lo regresa a su posicion original
            foundTooth.position.copy(movedTeeth.get(foundTooth));
            movedTeeth.delete(foundTooth);
        }
        //centtrar la camara en el diente seleccionado
        const bbox = new THREE.Box3().setFromObject(foundTooth);
        const center = bbox.getCenter(new THREE.Vector3());
        controls.target.copy(center);
        camera.position.copy(center.clone().add(new THREE.Vector3(0, 0, 5)));
    } else {
        console.warn(`Diente ${toothName} no encontrado en el modelo`);
    }
}

// Listener para la barra lateral
document.querySelectorAll('.tooth-option').forEach(option => {
    option.addEventListener('click', function () {
        const toothName = this.getAttribute('data-tooth');
        selectToothByName(toothName);

        // Resalta el seleccionado
        document.querySelectorAll('.tooth-option').forEach(opt => {
            opt.classList.remove('active');
        });
        this.classList.add('active');
    });
});

document.querySelector('.btn.regresar').addEventListener('click', () => {
    window.location.href = 'index.html';
});
