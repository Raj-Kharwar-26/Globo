import React, { useState } from "react";

import { useAuth } from "../context/AuthContext";

import { Phone, Plus, Globe, Crown } from "lucide-react";

import Dialer from "../components/Dialer";

interface VirtualNumber {
  _id: string;

  number: string;

  country: string;

  active: boolean;

  rented: boolean;

  expiresAt: string;
}

const countries = ["USA", "UK", "Japan", "Australia", "Singapore"];

const FREE_TRIAL_MODE = true;

const Dashboard = () => {
  const { user, generateNumber } = useAuth();

  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState(countries[0]);

  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);

  const handleNumberSelect = (number: VirtualNumber) => {
    if (number.rented) {
      setSelectedNumber(number.number);
    }
  };

  const handleGenerateNumber = async () => {
    try {
      await generateNumber(selectedCountry);

      setShowGenerateModal(false);
    } catch (err: any) {
      console.error("Error generating number:", err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Virtual Numbers Dashboard
          </h1>

          {user?.isAdmin && (
            <span className="inline-flex items-center mt-1 text-sm text-indigo-600">
              <Crown className="h-4 w-4 mr-1" />
              Admin Account
            </span>
          )}
        </div>

        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5" />

          <span>Generate Number</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Virtual Numbers List */}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Virtual Numbers
            </h2>

            {FREE_TRIAL_MODE && (
              <p className="text-sm text-indigo-600 mt-1">
                🎉 Free Trial Mode: All numbers are available for free rental!
              </p>
            )}
          </div>

          <div className="divide-y divide-gray-200">
            {user?.virtualNumbers && user.virtualNumbers.length > 0 ? (
              user.virtualNumbers.map((number: VirtualNumber) => (
                <div
                  key={number._id}
                  className={`p-6 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                    selectedNumber === number.number ? "bg-indigo-50" : ""
                  }`}
                  onClick={() => setSelectedNumber(number.number)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-100">
                      <Phone className="h-5 w-5 text-indigo-600" />
                    </div>

                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        {number.number}
                      </p>

                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Globe className="h-4 w-4" />

                        <span>{number.country}</span>

                        <span>•</span>

                        <span>Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-md">
                      Active
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                You haven't generated any virtual numbers yet.
              </div>
            )}
          </div>
        </div>

        {/* Dialer Section */}

        <div className="lg:sticky lg:top-8">
          <Dialer
            phoneNumber={selectedNumber}
            disabled={
              !selectedNumber ||
              !user?.virtualNumbers?.some(
                (n) => n.number === selectedNumber && n.rented
              )
            }
          />

          {!selectedNumber && (
            <div className="mt-4 text-center text-gray-500">
              Select a rented number to start making calls
            </div>
          )}
        </div>
      </div>

      {/* Generate Number Modal */}

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Generate Virtual Number</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Country
              </label>

              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                Cancel
              </button>

              <button
                onClick={handleGenerateNumber}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
