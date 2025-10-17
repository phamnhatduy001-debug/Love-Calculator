
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppStatus } from './types';
import HeartIcon from './components/HeartIcon';

const App: React.FC = () => {
  const [name1, setName1] = useState<string>('');
  const [name2, setName2] = useState<string>('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [percentage, setPercentage] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const generateLoveMessage = useCallback(async (n1: string, n2: string, p: number): Promise<string> => {
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set");
        return "Your connection is written in the stars, a truly cosmic pairing!";
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate a very short, playful, and romantic message for a couple named ${n1} and ${n2} whose love compatibility score is ${p}%. The message should be one or two sentences long, optimistic, and fun. Do not mention the percentage in your response. Keep it sweet and simple.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating message:", error);
        return "Love is a beautiful journey, and yours is just beginning!";
    }
  }, []);

  const fetchMessage = useCallback(async () => {
    if (!name1 || !name2 || percentage === null) return;
    setStatus(AppStatus.LOADING_MESSAGE);
    const generatedMessage = await generateLoveMessage(name1, name2, percentage);
    setMessage(generatedMessage);
    setStatus(AppStatus.RESULT);
  }, [name1, name2, percentage, generateLoveMessage]);

  useEffect(() => {
    if (status !== AppStatus.CALCULATING || percentage === null) return;

    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev < percentage) {
          return prev + 1;
        } else {
          clearInterval(interval);
          fetchMessage();
          return prev;
        }
      });
    }, 40);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, percentage]);

  const handleCalculate = () => {
    if (!name1.trim() || !name2.trim()) {
      setError('Please enter both names!');
      return;
    }
    setError('');
    
    // Simple deterministic "calculation" based on names
    const combinedNames = (name1 + name2).toLowerCase().replace(/\s/g, '');
    let charCodeSum = 0;
    for (let i = 0; i < combinedNames.length; i++) {
        charCodeSum += combinedNames.charCodeAt(i);
    }
    const lovePercentage = (charCodeSum % 81) + 20; // Ensure percentage is between 20 and 100

    setPercentage(lovePercentage);
    setStatus(AppStatus.CALCULATING);
  };

  const handleTryAgain = () => {
    setName1('');
    setName2('');
    setStatus(AppStatus.IDLE);
    setPercentage(null);
    setMessage('');
    setProgress(0);
    setError('');
  };

  const renderContent = () => {
    switch (status) {
      case AppStatus.CALCULATING:
      case AppStatus.LOADING_MESSAGE:
        return (
          <div className="flex flex-col items-center justify-center text-white w-full">
            <h2 className="text-2xl font-semibold mb-4">Calculating...</h2>
            <div className="relative w-48 h-48">
              <HeartIcon className="text-pink-300 w-full h-full" />
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-4xl font-bold text-pink-600">
                {progress}%
              </div>
            </div>
            <div className="w-full bg-white/30 rounded-full h-4 mt-6 overflow-hidden">
                <div className="bg-pink-500 h-4 rounded-full transition-all duration-150 ease-linear" style={{ width: `${progress}%` }}></div>
            </div>
            {status === AppStatus.LOADING_MESSAGE && (
                 <div className="mt-4 flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    <span>Crafting your love story...</span>
                 </div>
            )}
          </div>
        );
      case AppStatus.RESULT:
        return (
          <div className="flex flex-col items-center justify-center text-white animate-fade-in">
            <span className="text-xl">Your Love Score</span>
            <div className="relative my-4">
                 <HeartIcon className="w-48 h-48 text-pink-500 animate-pulse" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl font-bold text-white drop-shadow-lg">{percentage}%</span>
                 </div>
            </div>
            <p className="text-lg text-center italic mt-2 p-4 bg-black/20 rounded-lg">"{message}"</p>
            <button
              onClick={handleTryAgain}
              className="mt-8 w-full py-3 bg-white text-pink-500 font-bold rounded-full hover:bg-pink-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Try Again
            </button>
          </div>
        );
      case AppStatus.IDLE:
      default:
        return (
            <div className="w-full">
            <h1 className="font-title text-5xl text-white mb-2 text-center drop-shadow-md">Love Calculator</h1>
            <p className="text-white/80 text-center mb-8">What does fate say about your love?</p>
            <input
              type="text"
              value={name1}
              onChange={(e) => setName1(e.target.value)}
              placeholder="Your Name"
              className="w-full p-4 mb-4 bg-white/20 border-2 border-white/30 rounded-full text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-pink-400 backdrop-blur-sm"
            />
            <div className="my-4 flex justify-center items-center">
                <HeartIcon className="w-8 h-8 text-pink-400" />
            </div>
            <input
              type="text"
              value={name2}
              onChange={(e) => setName2(e.target.value)}
              placeholder="Your Partner's Name"
              className="w-full p-4 mb-6 bg-white/20 border-2 border-white/30 rounded-full text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-pink-400 backdrop-blur-sm"
            />
            {error && <p className="text-yellow-300 text-center mb-4">{error}</p>}
            <button
              onClick={handleCalculate}
              className="w-full py-4 bg-pink-500 text-white font-bold rounded-full hover:bg-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Calculate Love
            </button>
          </div>
        );
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600">
       <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
         {renderContent()}
       </div>
    </main>
  );
};

export default App;
