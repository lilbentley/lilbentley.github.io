import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

let video;
let mixer, clock = new THREE.Clock(), isClose = false;
let animations;  // Globally store animations
const videoTexture = setupVideoTexture();
loadModel();
setupCamera();
window.addEventListener('click', onMouseClick);
animate();

function setupVideoTexture() {
    const introVideo = document.createElement('video');
    introVideo.src = 'video/intro.mp4';
    introVideo.muted = true;

    const loopVideo = document.createElement('video');
    loopVideo.src = 'video/video_1.mp4';
    loopVideo.loop = true;
    loopVideo.muted = true;

    let videoTexture;

    introVideo.addEventListener('canplaythrough', () => {
        introVideo.play();
        console.log("Intro video is ready and playing.");
    });

    introVideo.addEventListener('ended', () => {
        video = loopVideo; // Switch to the loop video
        videoTexture.image = video; // Update the video texture
        video.play();
        console.log("Loop video is playing.");
    });

    video = introVideo; // Start with the intro video
    videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBAFormat;
    videoTexture.encoding = THREE.sRGBEncoding;

    return videoTexture;
}
    
function loadModel() {
    const loader = new GLTFLoader();
    loader.load('tv.glb', function(gltf) {
        scene.add(gltf.scene);
        gltf.scene.scale.set(5, 5, 5);
        gltf.scene.position.set(0, 0, 0);
        console.log('Model loaded:', gltf.scene);

        mixer = new THREE.AnimationMixer(gltf.scene);
        animations = gltf.animations; // Store animations for later use

       gltf.scene.traverse(function(node)
       {
    if (node.isMesh && node.material) {
    if (node.name === "SCREEN") {
        const screenMaterial = new THREE.MeshBasicMaterial({
            map: videoTexture,
            
        });
        
        node.material = screenMaterial;
    }
}
});



    }, undefined, function(error) {
        console.error('Error loading GLTF:', error);
    });
}

function setupCamera() {
    camera.position.set(0, 1, 8);
    camera.quaternion.setFromEuler(new THREE.Euler(0, 0, 0));
}

function animateCamera() {
    const action = mixer.clipAction(animations[0]);
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
    if (!action.isRunning()) {
        if (isClose) {
            action.reset();
            action.time = action.getClip().duration;
            action.timeScale = -2;
        } else {
            action.reset();
            action.time = 0;
            action.timeScale = 1.5;
        }
        action.play();
        isClose = !isClose; // Toggle state after deciding the direction
    }
}

function onMouseClick(event) {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        console.log('Touched object:', intersects[0].object.name);
        // Check if the clicked object is one of the specific objects
        if (intersects[0].object.name === 'FLOOR' || intersects[0].object.name === 'SCREEN') {
            animateCamera();
        }
        else if (intersects[0].object.name.startsWith('BUTTON_')) {
            playButtonAnimation(intersects[0].object);
        }
    }
}

function playButtonAnimation(button) {
    
    const action = mixer.clipAction(animations[1], button);
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
    if (!action.isRunning()) {
        action.reset();
        action.time = 0;
        action.timeScale = 1;
        action.play();
    }
    video.currentTime = 0;
    // Create a new video for the intro
    const introVideo = document.createElement('video');
    introVideo.src = 'video/intro.mp4';
    introVideo.muted = true;
    introVideo.play();

    // Update the video and video texture
    video = introVideo;
    videoTexture.image = video;

    video.onended = () => {
        // Play a different video based on the button name
        switch (button.name) {
            case 'BUTTON_1':
                video.src = 'video/video_1.mp4';
                break;
            case 'BUTTON_2':
                video.src = 'video/video_2.mp4';
                break;
           
            // Add more cases as needed
        }

        // Update the video texture
        videoTexture.image = video;

        video.play();
    };
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    if (isClose) {
        camera.position.lerp(new THREE.Vector3(1.7, 1.8, 2.5), 0.03);
        camera.quaternion.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)), 0.05);
    } else {
        camera.position.lerp(new THREE.Vector3(0, 1, 8), 0.02);
        camera.quaternion.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)), 0.05);
    }

    // Update the video texture each frame FRAGWUERDIG
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        videoTexture.needsUpdate = true;
    }
    
    renderer.render(scene, camera);
}

