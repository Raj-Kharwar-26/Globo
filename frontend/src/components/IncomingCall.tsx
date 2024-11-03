import React from "react";
import { Phone, PhoneOff } from "lucide-react";

interface IncomingCallProps {
  from: string;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCall: React.FC<IncomingCallProps> = ({
  from,
  onAccept,
  onReject,
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-lg font-bold">Incoming Call</h2>

        <p className="text-sm">From: {from}</p>

        <div className="flex justify-between mt-4">
          <button
            onClick={onAccept}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Accept <Phone className="inline" />
          </button>

          <button
            onClick={onReject}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Reject <PhoneOff className="inline" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCall;
