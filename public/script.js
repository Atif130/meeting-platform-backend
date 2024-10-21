const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;
let myVideoStream;
let peerConnections = {};
let isConnected = false; // New flag to track if already connected

// Get access to camera and mic
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream);

  // Join meeting based on the entered Meeting ID
  document.getElementById('meetingID').addEventListener('input', function() {
    const meetingID = this.value;
    if (meetingID && !isConnected) {
      // Join the meeting only if a valid meeting ID is entered and not already connected
      joinMeeting(meetingID);
    }
  });

  socket.on('user-connected', userId => {
    console.log('User connected: ', userId);
    connectToNewUser(userId, stream);
  });
}).catch(err => {
  console.error("Failed to access camera and microphone:", err);
});

function joinMeeting(meetingID) {
  if (meetingID && !isConnected) {
    socket.emit('join-meeting', meetingID);
    isConnected = true; // Mark as connected to prevent multiple connections
  }
}

// Connect to a new user
function connectToNewUser(userId, stream) {
  console.log('Connecting to new user: ', userId);

  const peer = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  });
  
  peerConnections[userId] = peer;

  stream.getTracks().forEach(track => {
    peer.addTrack(track, stream);
  });

  peer.onicecandidate = event => {
    if (event.candidate) {
      console.log('Sending ICE candidate to:', userId);
      socket.emit('ice-candidate', { candidate: event.candidate, to: userId });
    }
  };

  peer.ontrack = event => {
    console.log('Receiving stream from:', userId);
    const video = document.createElement('video');
    addVideoStream(video, event.streams[0]);
  };

  peer.createOffer().then(offer => {
    peer.setLocalDescription(offer);
    console.log('Sending offer to:', userId);
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

// When receiving an offer
socket.on('offer', data => {
  console.log('Received offer from:', data.from);
  
  const peer = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  });

  peerConnections[data.from] = peer;

  peer.onicecandidate = event => {
    if (event.candidate) {
      console.log('Sending ICE candidate back to:', data.from);
      socket.emit('ice-candidate', { candidate: event.candidate, to: data.from });
    }
  };

  peer.ontrack = event => {
    console.log('Receiving stream from:', data.from);
    const video = document.createElement('video');
    addVideoStream(video, event.streams[0]);
  };

  peer.setRemoteDescription(new RTCSessionDescription(data.offer));
  peer.createAnswer().then(answer => {
    peer.setLocalDescription(answer);
    console.log('Sending answer to:', data.from);
    socket.emit('answer', { answer: answer, to: data.from });
  });
});

// When receiving an answer
socket.on('answer', data => {
  console.log('Received answer from:', data.from);
  const peer = peerConnections[data.from];
  peer.setRemoteDescription(new RTCSessionDescription(data.answer));
});

// When receiving an ICE candidate
socket.on('ice-candidate', data => {
  console.log('Received ICE candidate from:', data.from);
  const peer = peerConnections[data.from];
  peer.addIceCandidate(new RTCIceCandidate(data.candidate));
});

// Mute/Unmute functionality
const muteButton = document.getElementById('mute-btn');
let isMuted = false;

muteButton.addEventListener('click', () => {
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        isMuted = !isMuted;
        muteButton.textContent = isMuted ? 'Unmute' : 'Mute';
    }
});

// Camera On/Off functionality
const cameraButton = document.getElementById('camera-btn');
let isCameraOn = true;

cameraButton.addEventListener('click', () => {
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        isCameraOn = videoTracks[0].enabled;
        cameraButton.textContent = isCameraOn ? 'Camera Off' : 'Camera On';
    }
});

// Start the media stream for local video

// Toggle Chat visibility
const showChatButton = document.getElementById('show-chat-btn');
const chatBox = document.getElementById('chat-box');
let isChatVisible = false;

showChatButton.addEventListener('click', () => {
    isChatVisible = !isChatVisible;
    chatBox.style.display = isChatVisible ? 'block' : 'none';
    showChatButton.textContent = isChatVisible ? 'Hide Chat' : 'Show Chat';
});

// Toggle Participants List visibility
const showParticipantsButton = document.getElementById('show-participants-btn');
const participantsList = document.getElementById('participants-list');
let isParticipantsVisible = false;

showParticipantsButton.addEventListener('click', () => {
    isParticipantsVisible = !isParticipantsVisible;
    participantsList.style.display = isParticipantsVisible ? 'block' : 'none';
    showParticipantsButton.textContent = isParticipantsVisible ? 'Hide Participants' : 'Show Participants';
});

// Raise Hand functionality
const raiseHandButton = document.getElementById('raise-hand-btn');
let isHandRaised = false;
const participantsListItems = document.querySelectorAll('#participants-list li');

// Toggle Raise Hand functionality
raiseHandButton.addEventListener('click', () => {
    isHandRaised = !isHandRaised;
    raiseHandButton.textContent = isHandRaised ? 'Lower Hand' : 'Raise Hand';

    // Assuming Participant 1 raises hand for demo purposes
    if (isHandRaised) {
        participantsListItems[0].textContent = 'Participant 1 ✋';
    } else {
        participantsListItems[0].textContent = 'Participant 1';
    }
});

// Leave Meeting functionality
const leaveButton = document.getElementById('leave-btn');
leaveButton.addEventListener('click', () => {
    window.location.href = 'post_meeting_summary.html';  // Redirect to post-meeting summary page
});

// Chat functionality
const chatInput = document.getElementById('chat-input');
const chatMessages = document.querySelector('.chat-messages');

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && chatInput.value.trim() !== '') {
        const message = chatInput.value;
        displayMessage(You: ${message});
        chatInput.value = ''; // Clear the input field
        // TODO: Implement sending the message to other participants
    }
});

function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to the latest message
}
