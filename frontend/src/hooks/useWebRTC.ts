import { useEffect, useRef, useState } from "react";

import { Socket } from "socket.io-client";

interface UseWebRTCProps {
  socket: Socket;

  userId: string;

  onError?: (message: string) => void;

  user?: {
    virtualNumbers: Array<{
      number: string;

      active: boolean;

      rented: boolean;
    }>;
  };
}

interface IncomingCall {
  from: string;

  callerNumber: string;

  recipientNumber: string;

  offer: RTCSessionDescriptionInit;
}

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },

    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const RINGTONE_URL = "/sounds/ringtone.mp3";

export const useWebRTC = ({
  socket,
  userId,
  onError,
  user,
}: UseWebRTCProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [isCallActive, setIsCallActive] = useState(false);

  const [isMuted, setIsMuted] = useState(false);

  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const currentCallId = useRef<string | null>(null);

  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  const [callDuration, setCallDuration] = useState(0);

  const [isRinging, setIsRinging] = useState(false);

  const timerRef = useRef<number | null>(null);

  const ringTimeoutRef = useRef<number | null>(null);

  const RING_TIMEOUT = 30000; // 30 seconds

  useEffect(() => {
    if (!userId || !socket) return;

    const connectSocket = () => {
      console.log("Connecting socket...");

      socket.connect();

      socket.emit("register", userId);
    };

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);

      socket.emit("register", userId);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");

      setTimeout(connectSocket, 3000);
    });

    socket.on(
      "incoming-call",
      async ({ from, offer, callerNumber, recipientNumber }) => {
        console.log(
          "Incoming call from:",
          callerNumber,
          "to:",
          recipientNumber
        );

        if (!ringtoneRef.current) {
          ringtoneRef.current = new Audio(RINGTONE_URL);

          ringtoneRef.current.loop = true;
        }

        try {
          const playPromise = ringtoneRef.current.play();

          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.error("Ringtone playback error:", error);
            });
          }
        } catch (error) {
          console.error("Error playing ringtone:", error);
        }

        setIncomingCall({
          from,

          offer,

          callerNumber,

          recipientNumber,
        });
      }
    );

    socket.on("call-rejected", ({ message }) => {
      console.log("Call rejected:", message);

      if (ringtoneRef.current) {
        ringtoneRef.current.pause();

        ringtoneRef.current.currentTime = 0;
      }

      endCall();
    });

    socket.on("call-ended", ({ message }) => {
      console.log("Call ended:", message);

      endCall();
    });

    socket.on("call-accepted", ({ answer, message }) => {
      console.log("Call connected:", message);

      if (peerConnection.current) {
        peerConnection.current
          .setRemoteDescription(new RTCSessionDescription(answer))

          .then(() => {
            console.log("Remote description set, starting call timer");

            setIsRinging(false);

            setIsCallActive(true);

            setCallDuration(0);
          })

          .catch((error) => {
            console.error("Error setting remote description:", error);

            onError?.("Failed to establish connection");
          });
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        if (peerConnection.current && candidate) {
          console.log("Received ICE candidate");

          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );

          console.log("Added ICE candidate successfully");
        }
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });

    connectSocket();

    return () => {
      socket.off("connect");

      socket.off("disconnect");

      socket.off("incoming-call");

      socket.off("call-rejected");

      socket.off("call-ended");

      socket.off("call-accepted");

      socket.off("ice-candidate");

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, [userId, socket]);

  useEffect(() => {
    ringtoneRef.current = new Audio(RINGTONE_URL);

    ringtoneRef.current.loop = true;

    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();

        ringtoneRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setCallDuration(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isCallActive]);

  const initializeStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      setLocalStream(stream);

      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);

      onError?.("Could not access microphone");

      throw error;
    }
  };

  const initializePeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection(configuration);

    stream.getTracks().forEach((track) => {
      console.log("Adding track to peer connection:", track.kind);

      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);

      if (event.streams && event.streams[0]) {
        console.log("Setting remote stream");

        setRemoteStream(event.streams[0]);

        const audio = new Audio();

        audio.srcObject = event.streams[0];

        audio.autoplay = true;

        audio.play().catch(console.error);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && currentCallId.current) {
        console.log("Sending ICE candidate");

        socket.emit("ice-candidate", {
          to: currentCallId.current,

          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state changed:", pc.connectionState);

      switch (pc.connectionState) {
        case "connected":
          console.log("Peers connected!");

          break;

        case "disconnected":
          console.log("Peers disconnected!");

          endCall();

          break;

        case "failed":
          console.log("Connection failed!");

          onError?.("Call connection failed");

          endCall();

          break;
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };

    peerConnection.current = pc;

    return pc;
  };

  const makeCall = async (toUserId: string, recipientNumber: string, selectedNumber: string) => {
    try {
      console.log("\nInitiating call:");
      console.log("=================");
      console.log("From:", selectedNumber);
      console.log("To:", recipientNumber);
      console.log("Socket ID:", socket.id);

      const stream = await initializeStream();
      const pc = initializePeerConnection(stream);
      currentCallId.current = toUserId;

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      
      await pc.setLocalDescription(offer);

      if (!socket.connected) {
        throw new Error("Socket not connected");
      }

      setIsRinging(true);

      socket.emit("call-user", {
        to: toUserId,
        from: userId,
        offer: pc.localDescription,
        callerNumber: selectedNumber,
        recipientNumber,
        fromSocket: socket.id
      });

    } catch (error) {
      console.error("Error making call:", error);
      onError?.(error instanceof Error ? error.message : "Failed to make call");
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      setIsRinging(false);

      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
      }

      console.log("Accepting call...");

      if (ringtoneRef.current) {
        ringtoneRef.current.pause();

        ringtoneRef.current.currentTime = 0;
      }

      const stream = await initializeStream();

      console.log("Local stream obtained");

      const pc = initializePeerConnection(stream);

      currentCallId.current = incomingCall.from;

      console.log("Setting remote description");

      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );

      console.log("Creating answer");

      const answer = await pc.createAnswer();

      console.log("Setting local description");

      await pc.setLocalDescription(answer);

      console.log("Sending call accepted");

      socket.emit("call-accepted", {
        to: incomingCall.from,

        answer,
      });

      setIsCallActive(true);

      setCallDuration(0);

      setIncomingCall(null);
    } catch (error) {
      console.error("Error accepting call:", error);

      onError?.("Failed to accept call");
    }
  };

  const rejectCall = () => {
    if (!incomingCall) return;

    console.log("Rejecting call from:", incomingCall.callerNumber);

    if (ringtoneRef.current) {
      ringtoneRef.current.pause();

      ringtoneRef.current.currentTime = 0;
    }

    socket.emit("call-rejected", {
      to: incomingCall.from,
    });

    setIncomingCall(null);
  };

  const endCall = () => {
    setIsRinging(false);

    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (currentCallId.current) {
      console.log("Ending call with:", currentCallId.current);

      socket.emit("end-call", { to: currentCallId.current });
    }

    if (localStream) {
      console.log("Stopping local stream tracks");

      localStream.getTracks().forEach((track) => track.stop());
    }

    if (peerConnection.current) {
      console.log("Closing peer connection");

      peerConnection.current.close();
    }

    setLocalStream(null);

    setRemoteStream(null);

    setIsCallActive(false);

    setIncomingCall(null);

    currentCallId.current = null;

    peerConnection.current = null;

    if (ringtoneRef.current) {
      ringtoneRef.current.pause();

      ringtoneRef.current.currentTime = 0;
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });

      setIsMuted(!isMuted);
    }
  };

  const toggleSpeaker = () => {
    const audioElement = document.querySelector("audio");

    if (audioElement) {
      audioElement.setSinkId(isSpeakerOn ? "default" : "speaker");

      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);

    const secs = seconds % 60;

    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return {
    localStream,

    remoteStream,

    isCallActive,

    isMuted,

    isSpeakerOn,

    incomingCall,

    makeCall,

    endCall,

    toggleMute,

    toggleSpeaker,

    acceptCall,

    rejectCall,

    callDuration,

    isRinging,

    formatDuration,
  };
};
