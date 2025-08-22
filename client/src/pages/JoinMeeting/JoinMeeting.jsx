import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { cn } from "../../lib/utils";
import Footer from "../../components/Footer/Footer";
import {
  Users,
  Mic,
  MicOff,
  Wifi,
  WifiOff,
  Settings,
} from "lucide-react";

const JoinMeeting = () => {
  const { id: meetingId } = useParams();
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(20);
  const mediaRecorderRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    connectToMeeting();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [meetingId]);

  const connectToMeeting = () => {
    const websocket = new WebSocket(
      `${import.meta.env.VITE_WS_URL || "ws://localhost:5000"}/transcribe`
    );

    websocket.onopen = () => {
      console.log("Connected to meeting");
      setIsConnected(true);
      // Send meeting ID to join
      websocket.send(
        JSON.stringify({
          type: "join_meeting",
          meetingId,
        })
      );
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "participants_update") {
        setParticipants(data.participants);
      }
      // Handle other message types
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    websocket.onclose = () => {
      console.log("Disconnected from meeting");
      setIsConnected(false);
    };

    wsRef.current = websocket;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (
          e.data.size > 0 &&
          wsRef.current &&
          wsRef.current.readyState === WebSocket.OPEN
        ) {
          // Send audio data to WebSocket
          e.data.arrayBuffer().then((buffer) => {
            wsRef.current.send(buffer);
          });
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const generateParticipantAvatars = () => {
    const colors = [
      "bg-purple-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    return Array.from({ length: participants.length || 3 }, (_, i) => (
      <div
        key={i}
        className={`w-12 h-12 rounded-full ${
          colors[i % colors.length]
        } flex items-center justify-center text-white font-semibold shadow-lg transform transition-all duration-300 hover:scale-110 animate-pulse`}
        style={{ animationDelay: `${i * 0.2}s` }}
      >
        {String.fromCharCode(65 + i)}
      </div>
    ));
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
          <div className=" min-h-screen h-full w-full">
            <header className="p-6 backdrop-blur-md bg-gray-200 dark:bg-gray-900 dark:text-white text-black shadow shadow-white dark:shadow-gray-950 border-b border-white/10">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isConnected
                          ? "bg-green-400 animate-pulse"
                          : "bg-red-400"
                      } shadow-lg`}
                    />
                    {isConnected ? (
                      <Wifi className="w-5 h-5 text-green-400" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-black dark:text-white tracking-tight">
                    Meeting Room
                  </h1>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-gray-300 dark:bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
                    <Users className="w-4 h-4 dark:text-gray-300 text-black" />
                    <span className="dark:text-white text-black font-medium">
                      {participants.length || 3}
                    </span>
                  </div>
                  <button className="p-2 dark:bg-white/10 bg-gray-300 rounded-full hover:bg-white/20 transition-all duration-200 backdrop-blur-sm">
                    <Settings className="w-5 h-5 dark:text-white text-black" />
                  </button>
                </div>
              </div>
            </header>
            <main className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center space-x-3 dark:bg-white/10 bg-gray-300 rounded-2xl px-6 py-3 backdrop-blur-md border border-white/20">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                    <span className="dark:text-white text-gray-900 font-mono text-lg tracking-wider">
                      {meetingId?.toUpperCase() || "ABC-DEF-GHI"}
                    </span>
                  </div>

                  <div className="flex justify-center space-x-4 mt-8">
                    {generateParticipantAvatars()}
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="relative">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`
                    w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-lg
                    transform transition-all duration-300 hover:scale-110 active:scale-95
                    shadow-2xl relative overflow-hidden
                    ${
                      isRecording
                        ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                        : "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    }
                  `}
                    >
                      {isRecording ? (
                        <MicOff className="w-8 h-8 animate-pulse" />
                      ) : (
                        <Mic className="w-8 h-8" />
                      )}

                      {isRecording && (
                        <>
                          <div
                            className="absolute inset-0 bg-white/20 rounded-full animate-ping"
                            style={{
                              opacity: audioLevel * 0.8,
                              transform: `scale(${1 + audioLevel * 0.3})`,
                            }}
                          />
                          <div
                            className="absolute inset-0 bg-white/10 rounded-full"
                            style={{
                              opacity: audioLevel * 0.6,
                              transform: `scale(${1 + audioLevel * 0.2})`,
                            }}
                          />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isRecording && (
                  <div className="text-center">
                    <div className="flex justify-center items-center space-x-2 text-red-300">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="font-medium">
                        Recording in progress...
                      </span>
                    </div>

                    <div className="mt-4 max-w-md mx-auto">
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-150"
                          style={{ width: `${audioLevel * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
          <Footer />
        </div>
      </section>
    </>
  );
};

export default JoinMeeting;
