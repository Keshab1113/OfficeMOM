import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { cn } from "../../lib/utils";
import Footer from "../../components/Footer/Footer";
import io from "socket.io-client";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

const ICE = [{ urls: "stun:stun.l.google.com:19302" }];

const JoinMeeting = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const [status, setStatus] = useState("Requesting to join…");
  const [statusType, setStatusType] = useState("info");
  const [isMuted, setIsMuted] = useState(false);
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const hostSocketIdRef = useRef(null);

  useEffect(() => {
    const run = async () => {
      setStatus("Connecting to server…");
      setStatusType("loading");

      const sock = io(`${import.meta.env.VITE_BACKEND_URL}`, {
        transports: ["websocket"],
      });
      socketRef.current = sock;

      let deviceLabel = navigator.userAgent;
      try {
        const streamTmp = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const track = streamTmp.getAudioTracks()[0];
        deviceLabel = track.label || deviceLabel;
        streamTmp.getTracks().forEach((t) => t.stop());
      } catch (error) {
        console.log("Error getting device info: ", error);
      }
      let myDeviceName = "Unknown Device";
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mic = devices.find((d) => d.kind === "audioinput");
        if (mic) {
          myDeviceName = mic.label || "Unnamed Microphone";
        }
      } catch (err) {
        console.error("Could not enumerate devices:", err);
      }

      setStatus("Requesting to join room…");
      sock.emit("guest:request-join", {
        id,
        deviceName: myDeviceName,
        deviceLabel,
      });

      sock.on("host:socket-id", ({ hostId }) => {
        console.log("Received host socket ID:", hostId);
        hostSocketIdRef.current = hostId;
        setStatus("Waiting for host approval…");
        setStatusType("info");
      });

      sock.on("guest:approved", async () => {
        setStatus("Approved. Connecting audio…");
        setStatusType("success");

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              channelCount: 1,
              sampleRate: 48000,
              sampleSize: 16,
            },
          });

          localStreamRef.current = stream;

          console.log("Guest audio tracks:", stream.getAudioTracks());

          // const monitorAudioLevels = () => {
          //   if (stream) {
          //     try {
          //       const audioContext = new AudioContext();
          //       const analyser = audioContext.createAnalyser();
          //       const source = audioContext.createMediaStreamSource(stream);
          //       source.connect(analyser);

          //       const dataArray = new Uint8Array(analyser.frequencyBinCount);
          //       analyser.getByteFrequencyData(dataArray);

          //       const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          //       console.log("Guest Audio level:", average);

          //       if (average > 5) {
          //         console.log("🎤 GUEST IS SPEAKING! Audio detected.");
          //       }

          //       audioContext.close();
          //     } catch (error) {
          //       console.log("Audio level check error:", error);
          //     }
          //   }
          // };

          // const audioInterval = setInterval(monitorAudioLevels, 2000);

          const audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(stream);
          const destination = audioContext.createMediaStreamDestination();
          source.connect(destination);

          const silentSource = audioContext.createOscillator();
          silentSource.frequency.setValueAtTime(0.1, audioContext.currentTime);
          silentSource.connect(audioContext.destination);
          silentSource.start();

          const pc = new RTCPeerConnection({
            iceServers: ICE,
            sdpSemantics: "unified-plan",
          });

          pcRef.current = pc;

          for (const track of destination.stream.getTracks()) {
            console.log(
              "Adding processed track:",
              track.id,
              "enabled:",
              track.enabled,
              "muted:",
              track.muted
            );
            pc.addTrack(track, destination.stream);
          }

          pc.onconnectionstatechange = () => {
            console.log("Guest connection state:", pc.connectionState);
          };

          pc.oniceconnectionstatechange = () => {
            console.log("Guest ICE connection state:", pc.iceConnectionState);
          };

          pc.onicegatheringstatechange = () => {
            console.log("Guest ICE gathering state:", pc.iceGatheringState);
          };

          pc.onsignalingstatechange = () => {
            console.log("Guest signaling state:", pc.signalingState);
          };

          pc.onicecandidate = (ev) => {
            if (ev.candidate && hostSocketIdRef.current) {
              console.log("Sending ICE candidate to host");
              sock.emit("signal", {
                to: hostSocketIdRef.current,
                data: { candidate: ev.candidate },
              });
            }
          };

          const offer = await pc.createOffer({
            offerToReceiveAudio: false,
            offerToReceiveVideo: false,
          });

          const modifiedOffer = {
            ...offer,
            sdp: offer.sdp.replace(
              /useinbandfec=1/g,
              "useinbandfec=1; stereo=0; maxaveragebitrate=128000"
            ),
          };

          await pc.setLocalDescription(modifiedOffer);

          if (hostSocketIdRef.current) {
            console.log("Sending SDP offer to host");
            sock.emit("signal", {
              to: hostSocketIdRef.current,
              data: { sdp: pc.localDescription },
            });
          }

          setStatus("Connected to meeting - Speak now!");
          setStatusType("success");

          const checkAudioLevels = () => {
            if (stream) {
              const audioContext = new AudioContext();
              const analyser = audioContext.createAnalyser();
              const source = audioContext.createMediaStreamSource(stream);
              source.connect(analyser);

              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              analyser.getByteFrequencyData(dataArray);

              const average =
                dataArray.reduce((a, b) => a + b) / dataArray.length;
              console.log("Audio level:", average);

              if (average > 5) {
                console.log("AUDIO DETECTED! Guest is speaking.");
              }

              audioContext.close();
            }
          };

          setInterval(checkAudioLevels, 2000);
        } catch (error) {
          console.error("Error setting up audio:", error);
          setStatus(
            "Error setting up audio. Please check microphone permissions."
          );
          setStatusType("error");
        }
      });

      sock.on("guest:denied", ({ reason }) => {
        setStatus(`Request denied: ${reason || "No reason provided"}`);
        setStatusType("error");
        setTimeout(() => {
          alert(reason || "Denied");
          nav("/");
        }, 2000);
      });

      sock.on("signal", async ({ data }) => {
        if (!pcRef.current) return;

        try {
          if (data.sdp) {
            console.log("Received SDP from host");
            await pcRef.current.setRemoteDescription(data.sdp);
          } else if (data.candidate) {
            console.log("Received ICE candidate from host");
            await pcRef.current.addIceCandidate(data.candidate);
          }
        } catch (error) {
          console.log("Error processing signal:", error);
        }
      });

      sock.on("room:ended", () => {
        setStatus("Meeting ended by host.");
        setStatusType("info");
        setTimeout(() => {
          alert("Meeting ended by host.");
          nav("/");
        }, 2000);
      });

      sock.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setStatus("Connection failed. Please try again.");
        setStatusType("error");
      });

      sock.on("connect", () => {
        setStatus("Connected to server");
        setStatusType("success");
      });
    };

    run();

    return () => {
      try {
        if (pcRef.current) {
          pcRef.current.close();
        }
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        socketRef.current?.disconnect();
      } catch (error) {
        console.log("Error in cleanup:", error);
      }
    };
  }, [id, nav]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      console.log("Toggling mute, current state:", isMuted);
      console.log("Audio tracks:", audioTracks);

      audioTracks.forEach((track) => {
        console.log(`Track ${track.id} enabled before:`, track.enabled);
        track.enabled = !track.enabled;
        console.log(`Track ${track.id} enabled after:`, track.enabled);
      });
      setIsMuted(!isMuted);
    }
  };

  const getStatusIcon = () => {
    switch (statusType) {
      case "loading":
        return <FaSpinner className="animate-spin" />;
      case "success":
        return <FaCheckCircle />;
      case "error":
        return <FaTimesCircle />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (statusType) {
      case "loading":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | LiveMeeting</title>
        <link rel="canonical" href="http://mysite.com/example" />
      </Helmet>
      <section className="relative h-full min-h-screen md:w-full w-screen dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)]">
        <div
          className={cn(
            "absolute inset-0",
            "[background-size:20px_20px]",
            "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]"
          )}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)]"></div>
        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll ">
          <div className=" min-h-screen h-full w-full flex justify-center items-center">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-indigo-600 p-4 text-white">
                <h1 className="text-xl font-semibold">Joining Meeting</h1>
                <p className="text-sm opacity-90">Room ID: {id}</p>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-center mb-6">
                  <div className={`text-4xl mr-3 ${getStatusColor()}`}>
                    {getStatusIcon()}
                  </div>
                  <div>
                    <p className={`font-medium ${getStatusColor()}`}>
                      {status}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Microphone
                    </span>
                    <button
                      onClick={toggleMute}
                      className={`flex cursor-pointer items-center gap-2 px-4 py-2 rounded-full ${
                        isMuted
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      } transition-colors`}
                    >
                      {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                      {isMuted ? "Unmute" : "Mute"}
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => nav("/")}
                    className="px-4 py-2 cursor-pointer bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Leave Meeting
                  </button>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </section>
    </>
  );
};
export default JoinMeeting;
