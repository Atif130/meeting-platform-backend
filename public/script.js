const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;

let myVideoStream;
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream);
    });
});

socket.on('user-disconnected', userId => {
    // Handle user disconnection
});

document.getElementById('join-btn').addEventListener('click', () => {
    const roomId = document.getElementById('room-input').value;
    if (roomId) {
        socket.emit('join-room', roomId, Math.random().toString(36).substring(7));
    }
});

function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    videoGrid.append(video);
}

function connectToNewUser(userId, stream) {
    // Handle peer-to-peer connection with Simple-Peer (add WebRTC functionality here)
}
