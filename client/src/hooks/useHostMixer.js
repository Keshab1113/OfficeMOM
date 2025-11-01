// export async function createHostMixerStream(localMic) {
//   const audioCtx = new AudioContext();
//   const dest = audioCtx.createMediaStreamDestination();
  
//   const connectedStreams = new Map();

//   if (localMic) {
//     try {
//       const src = audioCtx.createMediaStreamSource(localMic);
//       const gainNode = audioCtx.createGain();
//       gainNode.gain.value = 1.0;
      
//       src.connect(gainNode).connect(dest);
//       connectedStreams.set('host', { 
//         stream: localMic, 
//         source: src, 
//         gainNode 
//       });
//     } catch (err) {
//       console.error("Error connecting host mic:", err);
//     }
//   }

//   const addRemote = (remoteStream, socketId) => {
//     if (!remoteStream || connectedStreams.has(socketId)) return;

//     try {
//       const src = audioCtx.createMediaStreamSource(remoteStream);
//       const gainNode = audioCtx.createGain();
//       gainNode.gain.value = 1.0;

//       src.connect(gainNode).connect(dest);
//       connectedStreams.set(socketId, { 
//         stream: remoteStream, 
//         source: src, 
//         gainNode 
//       });
//     } catch (error) {
//       console.error("Error adding remote stream:", error);
//     }
//   };

//   const removeRemote = (socketId) => {
//     const streamInfo = connectedStreams.get(socketId);
//     if (streamInfo) {
//       try {
//         streamInfo.source.disconnect();
//         connectedStreams.delete(socketId);
//       } catch (error) {
//         console.error("Error removing remote stream:", error);
//       }
//     }
//   };

//   const getIndividualStreams = () => {
//     const streams = new Map();
//     connectedStreams.forEach((info, socketId) => {
//       const individualDest = audioCtx.createMediaStreamDestination();
//       info.source.connect(info.gainNode).connect(individualDest);
//       streams.set(socketId, individualDest.stream);
//     });
//     return streams;
//   };

//   return { 
//     mixedStream: dest.stream, 
//     addRemote, 
//     removeRemote,
//     getIndividualStreams,
//     audioContext: audioCtx 
//   };
// }

export async function createHostMixerStream(localMic) {
  const audioCtx = new AudioContext({ sampleRate: 48000 });
  const destination = audioCtx.createMediaStreamDestination();

  // Keep all active sources
  const connectedStreams = new Map();

  // 🎙️ Add the host mic
  if (localMic) {
    try {
      const hostSrc = audioCtx.createMediaStreamSource(localMic);
      const hostGain = audioCtx.createGain();
      hostGain.gain.value = 1.0;
      hostSrc.connect(hostGain).connect(destination);
      connectedStreams.set("host", { source: hostSrc, gain: hostGain });
      console.log("✅ Host mic added to mixer");
    } catch (err) {
      console.error("Error connecting host mic:", err);
    }
  }

  // 🎧 Add a remote guest stream into the mix
 const addRemote = async (remoteStream, socketId) => {
  if (!remoteStream || connectedStreams.has(socketId)) {
    console.log(`⚠️ Skipping remote add: stream=${!!remoteStream}, already has=${connectedStreams.has(socketId)}`);
    return;
  }

  const audioTracks = remoteStream.getAudioTracks();
  console.log(`🎧 Attempting to add remote ${socketId}: (${audioTracks.length} tracks)`);

  if (audioTracks.length === 0) {
    console.error(`❌ No audio tracks in remote stream for ${socketId}`);
    return;
  }

  audioTracks.forEach((track, idx) => {
    console.log(`   - Track ${idx}: id=${track.id}, enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}`);
  });

  try {
    if (audioCtx.state === "suspended") {
      console.log("⏯️ Resuming suspended AudioContext before adding remote");
      await audioCtx.resume();
    }

    const remoteSrc = audioCtx.createMediaStreamSource(remoteStream);
    const remoteGain = audioCtx.createGain();
    remoteGain.gain.value = 1.3;

    remoteSrc.connect(remoteGain).connect(destination);

    // Optional preview for debugging (autoplay muted)
    const debugAudio = document.createElement("audio");
    debugAudio.srcObject = remoteStream;
    debugAudio.autoplay = true;
    debugAudio.muted = true;
    document.body.appendChild(debugAudio);

    connectedStreams.set(socketId, { source: remoteSrc, gain: remoteGain });
    console.log(`✅ Remote ${socketId} added to mix and playing`);
  } catch (error) {
    console.error(`❌ Error adding remote stream for ${socketId}:`, error);
  }
};

  // ❌ Remove a guest when they leave
  const removeRemote = (socketId) => {
    const s = connectedStreams.get(socketId);
    if (s) {
      try {
        s.source.disconnect();
        connectedStreams.delete(socketId);
        console.log(`🛑 Removed remote stream ${socketId}`);
      } catch (err) {
        console.error("Error removing remote:", err);
      }
    }
  };

  // 🧪 Optional: preview mixed audio in browser for debug
  const playPreview = () => {
    const audioEl = document.createElement("audio");
    audioEl.srcObject = destination.stream;
    audioEl.autoplay = true;
    audioEl.controls = true;
    document.body.appendChild(audioEl);
  };

  // 🔊 Return everything the host needs
  return {
    mixedStream: destination.stream,
    addRemote,
    removeRemote,
    playPreview,
    audioContext: audioCtx,
  };
}
