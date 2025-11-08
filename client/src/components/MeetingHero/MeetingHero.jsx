import React from 'react';
import { Globe, Users, Zap, Target } from 'lucide-react';

export default function MeetingHero() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-24">
        {/* Hero Section */}
        <div className="text-center mb-16 md:mb-24">
          <h1 className="text-4xl sm:text-5xl  font-bold text-gray-900 dark:text-white pb-2 ">
            High Quality Meeting
          </h1>
          <h2 className="text-4xl sm:text-5xl  font-bold mb-8 md:mb-12">
            <span className="text-purple-600 dark:text-purple-400">Transcription</span>
            <span className="text-gray-900 dark:text-white"> & </span>
            <span className="text-purple-600 dark:text-purple-400">Recording</span>
          </h2>
          
          
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {/* Feature 1 */}
          <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              99% Accurate
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Fireflies is the industry leader in transcription accuracy.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              100+ Languages
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Transcribe meetings in English, Spanish, French, & several others.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Speaker Recognition
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Fireflies identifies different speakers in meetings and audio files.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Auto-Language Detection
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Automatically switch languages from meeting to meeting with ease.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}