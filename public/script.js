const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const muteBtn = document.getElementById('mute-btn');
const leaveBtn = document.getElementById('leave-btn');
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
});
const myVideo = document.createElement('video');
myVideo.muted = true;

const peers = {};
let myStream;

// Get video and audio stream
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myStream = stream;
  addVideoStream(myVideo, stream);

  // Answer calls from other users
  myPeer.on('call', call => {
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });
  });

  // When a new user connects
  socket.on('user-connected', userId => {
    setTimeout(() => connectToNewUser(userId, stream), 1000);
  });
});

// Remove disconnected users
socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close();
});

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement('video');
  
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  });

  call.on('close', () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}

// Mute / Unmute functionality
muteBtn.addEventListener('click', () => {
  const enabled = myStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myStream.getAudioTracks()[0].enabled = false;
    muteBtn.textContent = 'Unmute';
  } else {
    myStream.getAudioTracks()[0].enabled = true;
    muteBtn.textContent = 'Mute';
  }
});

// Leave room functionality
leaveBtn.addEventListener('click', () => {
  window.location.href = '/';
});
