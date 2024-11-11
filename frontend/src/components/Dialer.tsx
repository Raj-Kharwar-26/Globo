import React, { useState, useEffect } from "react";

import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Pause,
  ArrowLeft,
  Globe,
} from "lucide-react"; 

import { io, Socket } from "socket.io-client";

import { useWebRTC } from "../hooks/useWebRTC";

import { useAuth, API_URL } from "../context/AuthContext";

import axios from "axios";

interface DialerProps {
  phoneNumber: string | null;

  disabled?: boolean;
}

const countryCodeMap = {
  USA: "+1",

  UK: "+44",

  Japan: "+81",

  Australia: "+61",

  Singapore: "+65",
};

const Dialer: React.FC<DialerProps> = ({ phoneNumber, disabled }) => {
  const [inputNumber, setInputNumber] = useState("");

  const [selectedCountryCode, setSelectedCountryCode] = useState("+1");

  const [isOnHold, setIsOnHold] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  const [socket, setSocket] = useState<Socket | null>(null);

  const selectedNumberDetails = user?.virtualNumbers?.find(
    (n) => n.number === phoneNumber
  );

  const [showSelectedAlert, setShowSelectedAlert] = useState(false);

  useEffect(() => {
    if (phoneNumber) {
      setShowSelectedAlert(true);
      const timer = setTimeout(() => {
        setShowSelectedAlert(false);
      }, 3000); // Alert will disappear after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [phoneNumber]);

  useEffect(() => {
    const newSocket = io(
      "https://778c-2409-40e0-100e-2445-387e-cda9-4ceb-654c.ngrok-free.app"||"http://localserver:3001",
      {
        transports: ["websocket"],

        autoConnect: false,
      }
    );

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  const webRTCProps = {
    socket: socket!,
    userId: user?.id || "",
    user: user
      ? {
          virtualNumbers: user.virtualNumbers || [],
        }
      : undefined,
    onError: (message) => setError(message),
    callerNumber: phoneNumber, // Add this line
  };

  const {
    isCallActive,

    isMuted,

    isSpeakerOn,

    makeCall,

    endCall,

    toggleMute,

    toggleSpeaker,

    remoteStream,

    incomingCall,

    acceptCall,

    rejectCall,

    isRinging,

    callDuration,

    formatDuration,
  } = useWebRTC(webRTCProps);

  const dialPad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

  useEffect(() => {
    if (remoteStream) {
      const audio = new Audio();

      audio.srcObject = remoteStream;

      audio.autoplay = true;

      audio.play().catch(console.error);

      return () => {
        audio.pause();

        audio.srcObject = null;
      };
    }
  }, [remoteStream]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (incomingCall) {
      console.log("Showing incoming call alert:", incomingCall);
    }
  }, [incomingCall]);

  useEffect(() => {
    if (!isCallActive && inputNumber) {
      setInputNumber("");
    }
  }, [isCallActive]);

  const handleDial = (digit: string) => {
    if (!isCallActive) {
      setInputNumber((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setInputNumber((prev) => prev.slice(0, -1));
  };

  const formatPhoneNumber = (number: string) => {
    if (!number) return "";
    // If number already has a country code (starts with +), return as is
    if (number.startsWith("+")) return number;
    // Otherwise, add the selected country code
    return `${selectedCountryCode}${number}`;
  };

  const handleCall = async () => {
    if (isCallActive) {
      endCall();
      setInputNumber("");
    } else {
      try {
        setError(null);

        // Check if a number is selected for making the call
        if (!phoneNumber) {
          setError("Please select a number to call from");
          return;
        }

        const formattedNumber = formatPhoneNumber(inputNumber || "");

        if (!formattedNumber) {
          setError("Please enter a number to call");
          return;
        }

        // Check if the selected number is active
        const selectedNumberDetails = user?.virtualNumbers?.find(
          (n) => n.number === phoneNumber
        );

        if (!selectedNumberDetails?.active) {
          setError("Selected number is not active. Please activate it first.");
          return;
        }

        if (formattedNumber === phoneNumber) {
          setError("You cannot call your own number");
          return;
        }

        const response = await axios.get(
          `${API_URL}/phone/user/${formattedNumber}`,
          {
            headers: {
              "x-auth-token": localStorage.getItem("token"),
            },
          }
        );

        const recipientId = response.data.userId;

        if (recipientId === user?.id) {
          setError("You cannot call yourself");
          return;
        }

        // Pass the selected number (phoneNumber) as the third argument
        await makeCall(recipientId, formattedNumber, phoneNumber);
      } catch (error: any) {
        setError(error.response?.data?.message || "Failed to make call");
        setInputNumber("");
      }
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-indigo-50 via-white to-indigo-50 rounded-2xl shadow-xl p-8 max-w-sm mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl" />

      <div className="relative">
        {/* Error Message */}

        {error && (
          <div className="absolute inset-x-0 top-0 p-4 bg-red-100 rounded-t-2xl text-center">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Incoming Call Alert */}

        {incomingCall && !isCallActive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Incoming Call
              </h3>

              <p className="text-gray-600 mb-6">
                From: {incomingCall.callerNumber}
                <br />
                To: {incomingCall.recipientNumber}
              </p>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    console.log("Accepting call");

                    acceptCall();
                  }}
                  className="flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Accept
                </button>

                <button
                  onClick={() => {
                    console.log("Rejecting call");

                    rejectCall();
                  }}
                  className="flex items-center px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  <PhoneOff className="h-5 w-5 mr-2" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Country Code Selector */}

        <div className="mb-4">
          <div className="flex items-center space-x-2 p-2 bg-white rounded-lg shadow-sm">
            <Globe className="h-5 w-5 text-gray-500" />

            <select
              value={selectedCountryCode}
              onChange={(e) => setSelectedCountryCode(e.target.value)}
              className="flex-1 border-none focus:ring-0 text-gray-700"
              disabled={isCallActive || disabled}
            >
              {Object.entries(countryCodeMap).map(([country, code]) => (
                <option key={code} value={code}>
                  {country} ({code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Number Display */}

        <div className="text-center mb-8">
          <div className="glassmorphism rounded-xl p-4 mb-2 bg-white/30 backdrop-blur-lg border border-white/40">
            <div className="text-2xl font-semibold text-gray-800">
              {isCallActive
                ? incomingCall
                  ? incomingCall.callerNumber
                  : formatPhoneNumber(inputNumber || phoneNumber || "")
                : inputNumber
                ? formatPhoneNumber(inputNumber)
                : "Enter Number"}
            </div>

            {isCallActive && (
              <div className="text-lg text-green-600 mt-2 font-medium">
                {formatDuration(callDuration)}
              </div>
            )}

            {isRinging && !isCallActive && (
              <div className="text-sm text-blue-600 mt-1 font-medium animate-pulse">
                {incomingCall ? "Incoming call..." : "Calling..."}
              </div>
            )}

            {!isRinging && !isCallActive && incomingCall && (
              <div className="text-sm text-blue-600 mt-1 font-medium">
                Incoming call...
              </div>
            )}
          </div>
        </div>

        {showSelectedAlert && phoneNumber && (
          <div className="absolute top-0 left-0 right-0 p-3 bg-green-100 text-green-800 rounded-t-2xl text-center transition-opacity duration-300">
            Selected number: {phoneNumber}
            {!selectedNumberDetails?.active && " (Inactive)"}
          </div>
        )}

        {/* Dial Pad */}

        <div className="grid grid-cols-3 gap-4 mb-8">
          {dialPad.map((digit) => (
            <button
              key={digit}
              onClick={() => handleDial(digit)}
              disabled={isCallActive || disabled}
              className="dial-button h-16 rounded-2xl bg-white shadow-sm hover:shadow-md text-xl font-semibold text-gray-700 hover:text-indigo-600 hover:border-indigo-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed z-10"
            >
              {digit}
            </button>
          ))}
        </div>

        {/* Call Controls */}

        <div className="grid grid-cols-5 gap-3">
          <button
            onClick={handleCall}
            disabled={
              disabled || (!isCallActive && !inputNumber && !phoneNumber)
            }
            className={`dial-button flex items-center justify-center h-14 rounded-2xl transition-all duration-300 z-10 ${
              isCallActive
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isCallActive ? (
              <PhoneOff className="h-6 w-6" />
            ) : (
              <Phone className="h-6 w-6" />
            )}
          </button>

          <button
            onClick={toggleMute}
            disabled={!isCallActive}
            className={`dial-button flex items-center justify-center h-14 rounded-2xl transition-all duration-300 z-10 ${
              isMuted
                ? "bg-red-100 text-red-600 hover:bg-red-200"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isMuted ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </button>

          <button
            onClick={toggleSpeaker}
            disabled={!isCallActive}
            className={`dial-button flex items-center justify-center h-14 rounded-2xl transition-all duration-300 z-10 ${
              isSpeakerOn
                ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSpeakerOn ? (
              <Volume2 className="h-6 w-6" />
            ) : (
              <VolumeX className="h-6 w-6" />
            )}
          </button>

          <button
            onClick={() => setIsOnHold(!isOnHold)}
            disabled={!isCallActive}
            className={`dial-button flex items-center justify-center h-14 rounded-2xl transition-all duration-300 z-10 ${
              isOnHold
                ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Pause className="h-6 w-6" />
          </button>

          <button
            onClick={handleBackspace}
            disabled={isCallActive || disabled}
            className="dial-button flex items-center justify-center h-14 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed z-10"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dialer;
