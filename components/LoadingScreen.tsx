
import React from 'react';

interface LoadingScreenProps {
  progress: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  return (
    <div className="loading-screen">
      <div className="tech-animation-container">
        <div className="tech-ring"></div>
        <div className="tech-glow"></div>
        <div className="relative w-full h-full bg-blue-600 rounded-2xl flex items-center justify-center z-10 shadow-lg shadow-blue-500/30 animate-sparkle">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
      </div>
      <h2 className="text-3xl font-extrabold text-blue-300 tracking-wide mb-4 animate-pulse-glow">LeadGenius <span className="text-blue-500">AI</span></h2>
      <p className="text-xl text-slate-400 mb-2">
        {progress < 50 ? 'Carregando recursos...' : 'Iniciando inteligência artificial...'}
      </p>
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        ></div>
      </div>
      <p className="text-md text-slate-500 mt-2">{progress}%</p>
      <div className="mt-12 text-sm text-slate-500 flex items-center gap-1 font-medium">
        Feito com muito <span className="text-red-500">♥️</span> e <span>☕</span> por Marcos
      </div>
    </div>
  );
};

export default LoadingScreen;
