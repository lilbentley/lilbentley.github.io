import * as THREE from 'three';



const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let mixer, clock = new THREE.Clock(), isClose = true;
let animations, remoteAction; 
renderer.outputEncoding = THREE.sRGBEncoding;
let cameraTargetPosition = new THREE.Vector3(0, 1, 8);
camera.position.set(0, 1, 8);   

const videos = {
    intro: createVideoTexture('intro'),
    video1: createVideoTexture('video_1', true),
    video2: createVideoTexture('video_2', true),
    video3: createVideoTexture('video_3', true),
    video4: createVideoTexture('video_4', true),
    video5: createVideoTexture('video_5', true),
    video6: createVideoTexture('video_6', true),
    videoContact: createVideoTexture('video_contact', true),

};

let currentVideo = videos.intro;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener('click', onClick);
autoStart();

const material = new THREE.MeshBasicMaterial({ map: videos.intro });





function createVideoTexture(id, loop = false) {
    const video = document.getElementById(id);
    /* video.src = url; */
    video.loop = loop;
    video.muted = true;  

    


    /* video.load();  // Important for setting up the initial state */
    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter; 
    texture.encoding = THREE.sRGBEncoding; // Avoids issues with non-power-of-2 video dimensions
    return texture;
}


function disposeVideoTexture(texture) {
    texture.image.pause();
    texture.image.src = '';
    texture.image.load();
    texture.dispose();
}


function loadModel() {
    if (window.loadedModel) {
        const gltf = window.loadedModel;
        scene.add(gltf.scene);
        gltf.scene.scale.set(5, 5, 5);
        gltf.scene.position.set(0, 0, 0);
        console.log('Model used from preload:', gltf.scene);

        mixer = new THREE.AnimationMixer(gltf.scene);
        animations = gltf.animations; 

        remoteAction = mixer.clipAction(animations[0]);
        remoteAction.setLoop(THREE.LoopOnce);
        remoteAction.clampWhenFinished = true;

        gltf.scene.traverse(function(node){
            if (node.isMesh && node.material) {
                if (node.name === "SCREEN") {
                    const screenMaterial = new THREE.MeshBasicMaterial({map: videos.intro,});

                    node.material = screenMaterial;

                    const light = new THREE.PointLight(0xffffff, 100, 2);
                    node.getWorldPosition(light.position);
                    light.position.z += 1;
                    scene.add(light);
                }
            }
        });
    } else {
        console.error('Preloaded model is not available.');
    }
}




function animButton(button){
    const buttonAction = mixer.clipAction(animations[1], button);
    buttonAction.setLoop(THREE.LoopOnce);
    buttonAction.clampWhenFinished = true;
    if (!buttonAction.isRunning()) {
        buttonAction.reset();
        buttonAction.time = 0;
        buttonAction.timeScale = 1;
        buttonAction.play();
    }
}

function switchStates(){
    if (!remoteAction.isRunning()) {
        if(isClose){
            
            cameraTargetPosition.set(1.7, 1.8, 2.5);
    
            remoteAction.reset();
            remoteAction.timeScale = 1;
            remoteAction.play();
            
            isClose = false;
        } else {
            
            cameraTargetPosition.set(0, 1, 8);
    
            remoteAction.reset();
            remoteAction.time = remoteAction.getClip().duration;
            remoteAction.timeScale = -2;
            remoteAction.play();
    
    
            isClose = true;
        }
    } 

}

function onClick(event) {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        console.log('Touched object:', intersects[0].object.name);
        switch (intersects[0].object.name) {
            case 'FLOOR':
            case 'FRIDGE':
            case 'SCREEN':

                switchStates();
                break;

            case 'BUTTON_1':
                playIntroThenVideo(videos.video1);
                animButton(intersects[0].object);
                scene.remove(scene.getObjectByName("LINK_CONTACT"));
                break;

            case 'BUTTON_2':
                playIntroThenVideo(videos.video2);
                animButton(intersects[0].object);
                scene.remove(scene.getObjectByName("LINK_CONTACT"));
                break;

            case 'BUTTON_3':
                playIntroThenVideo(videos.video3);
                animButton(intersects[0].object);
                scene.remove(scene.getObjectByName("LINK_CONTACT"));
                break;

            case 'BUTTON_4':
                playIntroThenVideo(videos.video4);
                animButton(intersects[0].object);
                scene.remove(scene.getObjectByName("LINK_CONTACT"));
                break;

            case 'BUTTON_5':
                playIntroThenVideo(videos.video5);
                animButton(intersects[0].object);
                scene.remove(scene.getObjectByName("LINK_CONTACT"));
                break;

            case 'BUTTON_6':
                playIntroThenVideo(videos.video6);
                animButton(intersects[0].object);
                scene.remove(scene.getObjectByName("LINK_CONTACT"));
                break;

            case 'BUTTON_CONTACT':
                playIntroThenVideo(videos.videoContact);
                animButton(intersects[0].object);

                const geometry = new THREE.BoxGeometry(2.1, 1.4, 1);
                const material = new THREE.MeshBasicMaterial({color: 0x00ff00, transparent: true, opacity: 0}); // Change color as needed
                const linkContact = new THREE.Mesh(geometry, material);
                linkContact.position.set(0.75, 2, -0.5);
                linkContact.name = "LINK_CONTACT";

                // Add the cube to the scene
                scene.add(linkContact);

                break;

            case 'LINK_CONTACT': 
                window.open('https://many.bio/_', '_blank');
                break;        

            default:
                break;
        }
        
    }
}


function playIntroThenVideo(selectedVideo) {
    if (!videos.intro.image.paused) {
        videos.intro.image.pause();
        videos.intro.image.currentTime = 0;
    }

    // Update the video texture on the GLTF model's screen to the intro video
    scene.traverse(function(node) {
        if (node.isMesh && node.material) {
            if (node.name === "SCREEN") {
                node.material.map = videos.intro;
                node.material.needsUpdate = true;
            }
        }
    });

    videos.intro.image.play();

    


    currentVideo = videos.intro;
    
    videos.intro.image.onended = () => {
        material.map = selectedVideo;
        selectedVideo.image.currentTime = 0;  // Ensure the video starts from the beginning
        selectedVideo.image.play();

        if (currentVideo !== videos.intro) {
            disposeVideoTexture(currentVideo);
        }
        currentVideo = selectedVideo;

        // Update the video texture on the GLTF model's screen to the selected video
        scene.traverse(function(node) {
            if (node.isMesh && node.material) {
                if (node.name === "SCREEN") {
                    node.material.map = selectedVideo;
                    node.material.needsUpdate = true;
                }
            }
        });
    };
}


function autoStart() {
    loadModel();
    playIntroThenVideo(videos.video1);
    animate();
}


function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);


    camera.position.lerp(cameraTargetPosition, 0.02);

    renderer.render(scene, camera);
    
}


