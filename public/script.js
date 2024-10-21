const socket = io();
const videoGrid = document.getElementById('video-grid');
const localVideo = document.getElementById('localVideo');
let localStream;
let peerConnections = {};
let isConnected = false; // Flag to track connection state

// Get access to camera and mic
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;

        // Join meeting based on the entered Meeting ID
        document.getElementById('meetingID').addEventListener('input', function() {
            const meetingID = this.value;
            if (meetingID && !isConnected) {
                joinMeeting(meetingID);
            }
        });

        socket.on('user-connected', userId => {
            connectToNewUser(userId, stream);
        });
    })
    .catch(err => {
        console.error("Failed to access camera and microphone:", err);
    });

function joinMeeting(meetingID) {
    if (meetingID && !isConnected) {
        socket.emit('join-meeting', meetingID);
        isConnected = true; // Mark as connected
    }
}

// Connect to a new user
function connectToNewUser(userId, stream) {
    if (!peerConnections[userId]) {
        const peer = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        peerConnections[userId] = peer;

        stream.getTracks().forEach(track => {
            peer.addTrack(track, stream);
        });

        peer.onicecandidate = event => {
            if (event.candidate) {
                socket.emit('ice-candidate', { candidate: event.candidate, to: userId });
            }
        };

        peer.ontrack = event => {
            const video = document.createElement('video');
            video.srcObject = event.streams[0];
            video.autoplay = true;
            videoGrid.append(video);
        };

        peer.createOffer().then(offer => {
            peer.setLocalDescription(offer);
            socket.emit('offer', { offer: offer, to: userId });
        });
    }
}

// When receiving an offer
socket.on('offer', data => {
    const peer = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peerConnections[data.from] = peer;

    peer.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('ice-candidate', { candidate: event.candidate, to: data.from });
        }
    };

    peer.ontrack = event => {
        const video = document.createElement('video');
        video.srcObject = event.streams[0];
        video.autoplay = true;
        videoGrid.append(video);
    };

    peer.setRemoteDescription(new RTCSessionDescription(data.offer))
        .then(() => peer.createAnswer())
        .then(answer => peer.setLocalDescription(answer))
        .then(() => {
            socket.emit('answer', { answer: answer, to: data.from });
        });
});

// When receiving an answer
socket.on('answer', data => {
    const peer = peerConnections[data.from];
    if (peer) {
        peer.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
});

// When receiving an ICE candidate
socket.on('ice-candidate', data => {
    const peer = peerConnections[data.from];
    if (peer) {
        peer.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
});

// Mute/Unmute functionality
document.getElementById('mute-btn').addEventListener('click', () => {
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        document.getElementById('mute-btn').textContent = audioTracks[0].enabled ? 'Mute' : 'Unmute';
    }
});

// Camera On/Off functionality
document.getElementById('camera-btn').addEventListener('click', () => {
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        document.getElementById('camera-btn').textContent = videoTracks[0].enabled ? 'Camera Off' : 'Camera On';
    }
});
