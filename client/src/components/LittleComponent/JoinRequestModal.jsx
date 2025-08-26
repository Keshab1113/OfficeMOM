import React from 'react';
import { FaCheck, FaTimes, FaUser } from 'react-icons/fa';

export default function JoinRequestModal({ reqs, onApprove, onReject }) {
  if (!reqs.length) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-indigo-600 text-white p-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FaUser /> Join Requests ({reqs.length})
          </h3>
        </div>
        <div className="max-h-96 overflow-y-auto p-4">
          <ul className="space-y-3">
            {reqs.map(r => (
              <li key={r.socketId} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <div className="font-medium text-gray-800">{r.name || 'Guest'}</div>
                <div className="text-xs text-gray-500 mt-1">{r.deviceLabel || 'Unknown device'}</div>
                <div className="mt-3 flex gap-2">
                  <button 
                    className="px-3 py-2 bg-green-600 text-white rounded flex items-center gap-2 hover:bg-green-700 flex-1 justify-center"
                    onClick={() => onApprove(r.socketId)}
                  >
                    <FaCheck /> Admit
                  </button>
                  <button 
                    className="px-3 py-2 bg-red-600 text-white rounded flex items-center gap-2 hover:bg-red-700 flex-1 justify-center"
                    onClick={() => onReject(r.socketId)}
                  >
                    <FaTimes /> Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}