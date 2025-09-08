import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Failure = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState([]);
  const nav = useNavigate();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    setIsVisible(true);

    // Generate floating particles
    const particleArray = [];
    for (let i = 0; i < 15; i++) {
      particleArray.push({
        id: i,
        left: Math.random() * 100,
        animationDelay: Math.random() * 3,
        size: Math.random() * 6 + 3,
      });
    }
    setParticles(particleArray);
  }, []);

  const handleRetry = () => {
    nav(token ? "/pricing" : "/login")
  };

  return (
    <div className="relative md:max-h-screen min-h-screen md:min-h-full 
      bg-gradient-to-br from-rose-50 via-red-50 to-pink-100 
      dark:from-gray-900 dark:via-gray-950 dark:to-black overflow-hidden">
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Floating particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-rose-300 dark:bg-rose-600 rounded-full opacity-40 animate-bounce"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.animationDelay}s`,
              animationDuration: '4s',
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
          />
        ))}
        
        {/* Gradient orbs */}
        <div className="absolute top-20 left-20 w-64 h-64 
          bg-gradient-to-r from-rose-300 to-pink-300 dark:from-rose-600 dark:to-red-600 
          rounded-full opacity-15 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 
          bg-gradient-to-r from-red-300 to-rose-300 dark:from-red-700 dark:to-rose-800 
          rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className={`text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'}`}>
          
          {/* Failure icon with shake animation */}
          <div className="mb-2 flex justify-center">
            <div className="relative">
              <div className="w-22 h-22 sm:w-30 sm:h-30 
                bg-gradient-to-r from-rose-400 to-red-500 dark:from-rose-600 dark:to-red-700 
                rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <svg className="w-10 h-10 sm:w-14 sm:h-14 text-white animate-shake" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              {/* Ripple effect */}
              <div className="absolute inset-0 rounded-full bg-rose-400 dark:bg-rose-600 opacity-20 animate-ping"></div>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold 
            bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 dark:from-rose-400 dark:via-red-500 dark:to-pink-500 
            bg-clip-text text-transparent mb-4 leading-tight">
            Payment Failed
          </h1>

          {/* Subheading */}
          <div className="mb-4">
            <p className="text-xl sm:text-2xl lg:text-3xl text-rose-700 dark:text-rose-400 font-semibold mb-1 animate-fade-in">
              😔 Oops! Something went wrong
            </p>
            <p className="text-base sm:text-lg text-rose-600 dark:text-rose-300 max-w-lg mx-auto opacity-90 mb-0">
              Don't worry, this happens sometimes. Your card wasn't charged.
            </p>
            <p className="text-sm text-rose-500 dark:text-rose-400 max-w-xl mx-auto opacity-80">
              Please check your payment details and try again, or contact support if the issue persists.
            </p>
          </div>

          {/* Error details card */}
          <div className="mb-4 max-w-md mx-auto">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm 
              border border-rose-200 dark:border-rose-600 rounded-2xl p-4 shadow-lg">
              <h3 className="text-lg font-semibold text-rose-700 dark:text-rose-400 mb-3 flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Common Issues
              </h3>
              <ul className="text-sm text-rose-600 dark:text-rose-300 space-y-1 text-left">
                <li>• Insufficient funds</li>
                <li>• Incorrect card details</li>
                <li>• Network connectivity</li>
                <li>• Card expired or blocked</li>
              </ul>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={handleRetry}
              className="group cursor-pointer relative px-8 py-4 
              bg-gradient-to-r from-rose-500 to-red-600 dark:from-rose-600 dark:to-red-700 
              text-white font-semibold rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ease-out"
            >
              <span className="relative z-10 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-red-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            
            <button 
              onClick={()=>nav("/contact-us")} 
              className="px-8 cursor-pointer py-4 border-2 border-rose-500 dark:border-rose-600 
              text-rose-600 dark:text-rose-400 font-semibold rounded-full hover:bg-rose-50 dark:hover:bg-gray-900 
              transform hover:scale-105 transition-all duration-300 ease-out flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.18l6.364 6.364L12 21.82 5.636 8.544 12 2.18z" />
              </svg>
              Contact Support
            </button>
          </div>

          {/* Help section */}
          <div className="mt-6">
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-sm text-rose-600 dark:text-rose-400">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-rose-500 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Quick support response
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-rose-500 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Secure payment processing
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-rose-500 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Your data is safe
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-10 right-10 text-4xl animate-spin-slow opacity-15">💫</div>
      <div className="absolute bottom-10 left-10 text-3xl animate-bounce opacity-20" style={{ animationDelay: '0.5s' }}>🔧</div>
      <div className="absolute top-1/3 left-10 text-2xl animate-pulse opacity-15" style={{ animationDelay: '1s' }}>⚡</div>
      <div className="absolute bottom-1/3 right-10 text-3xl animate-bounce opacity-20" style={{ animationDelay: '1.5s' }}>🔄</div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out 0.5s both;
        }
        
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
        
        .animate-shake {
          animation: shake 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Failure;
