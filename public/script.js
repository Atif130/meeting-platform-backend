const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;
let myVideoStream;
let peerConnections = {};
let isConnected = false;

// Get access to camera and mic
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream);

  document.getElementById('meetingID').addEventListener('input', function() {
    const meetingID = this.value;
    if (meetingID && !isConnected) {
      joinMeeting(meetingID);
    }
  });

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream);
  });
}).catch(err => {
  console.error("Failed to access camera and microphone:", err);
});

function joinMeeting(meetingID) {
  if (meetingID && !isConnected) {
    socket.emit('join-meeting', meetingID);
    isConnected = true;
  }
}

function connectToNewUser(userId, stream) {
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
    addVideoStream(video, event.streams[0]);
  };

  peer.createOffer().then(offer => {
    peer.setLocalDescription(offer);
    socket.emit('offer', { offer: offer, to: userId });
  });
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}

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
    addVideoStream(video, event.streams[0]);
  };

  peer.setRemoteDescription(new RTCSessionDescription(data.offer));
  peer.createAnswer().then(answer => {
    peer.setLocalDescription(answer);
    socket.emit('answer', { answer: answer, to: data.from });
  });
});

socket.on('answer', data => {
  const peer = peerConnections[data.from];
  peer.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on('ice-candidate', data => {
  const peer = peerConnections[data.from];
  peer.addIceCandidate(new RTCIceCandidate(data.candidate));
});

// Mute/Unmute
const muteButton = document.getElementById('mute-btn');
muteButton.addEventListener('click', () => {
    const audioTracks = myVideoStream.getAudioTracks();
    if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        muteButton.textContent = audioTracks[0].enabled ? 'Mute' : 'Unmute';
    }
});

// Camera On/Off
const cameraButton = document.getElementById('camera-btn');
cameraButton.addEventListener('click', () => {
    const videoTracks = myVideoStream.getVideoTracks();
    if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        cameraButton.textContent = videoTracks[0].enabled ? 'Camera Off' : 'Camera On';
    }
});

// Show Chat
document.getElementById('show-chat-btn').addEventListener('click', () => {
  const chatBox = document.getElementById('chat-box');
  chatBox.style.display = chatBox.style.display === 'none' ? 'block' : 'none';
});

// Raise Hand
document.getElementById('raise-hand-btn').addEventListener('click', () => {
  socket.emit('raise-hand');
});

// Leave Meeting
document.getElementById('leave-btn').addEventListener('click', () => {
  window.location.href = '/'; // Navigate back to home page
});
