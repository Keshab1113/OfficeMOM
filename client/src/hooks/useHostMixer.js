export async function createHostMixerStream(localMic) {
  const audioCtx = new AudioContext();
  const dest = audioCtx.createMediaStreamDestination();
  
  const connectedStreams = new Map();

  if (localMic) {
    try {
      const src = audioCtx.createMediaStreamSource(localMic);
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 1.0;
      
      src.connect(gainNode).connect(dest);
      connectedStreams.set('host', { 
        stream: localMic, 
        source: src, 
        gainNode 
      });
    } catch (err) {
      console.error("Error connecting host mic:", err);
    }
  }

  const addRemote = (remoteStream, socketId) => {
    if (!remoteStream || connectedStreams.has(socketId)) return;

    try {
      const src = audioCtx.createMediaStreamSource(remoteStream);
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 1.0;

      src.connect(gainNode).connect(dest);
      connectedStreams.set(socketId, { 
        stream: remoteStream, 
        source: src, 
        gainNode 
      });
    } catch (error) {
      console.error("Error adding remote stream:", error);
    }
  };

  const removeRemote = (socketId) => {
    const streamInfo = connectedStreams.get(socketId);
    if (streamInfo) {
      try {
        streamInfo.source.disconnect();
        connectedStreams.delete(socketId);
      } catch (error) {
        console.error("Error removing remote stream:", error);
      }
    }
  };

  const getIndividualStreams = () => {
    const streams = new Map();
    connectedStreams.forEach((info, socketId) => {
      const individualDest = audioCtx.createMediaStreamDestination();
      info.source.connect(info.gainNode).connect(individualDest);
      streams.set(socketId, individualDest.stream);
    });
    return streams;
  };

  return { 
    mixedStream: dest.stream, 
    addRemote, 
    removeRemote,
    getIndividualStreams,
    audioContext: audioCtx 
  };
}