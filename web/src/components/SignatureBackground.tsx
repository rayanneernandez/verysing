import React from 'react';
import './SignatureBackground.css';

export const SignatureBackground: React.FC = () => {
  return (
    <div className="signature-background-container">
      <svg
        viewBox="0 0 1000 600"
        className="signature-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#93c5fd" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Glow/Blur Layer (Background) */}
        <path
          className="signature-path"
          d="M100,350 
             C120,150 350,150 300,350 
             C250,550 500,500 550,350 
             C600,200 800,200 750,400 
             C700,600 900,450 900,300"
          style={{ strokeWidth: 25, opacity: 0.3, filter: 'blur(15px)' }}
        />

        {/* Main signature loop (Middle) */}
        <path
          className="signature-path"
          d="M100,350 
             C120,150 350,150 300,350 
             C250,550 500,500 550,350 
             C600,200 800,200 750,400 
             C700,600 900,450 900,300"
        />
        
        {/* Core Brightness Layer (Top - Thinner and brighter) */}
        <path
          className="signature-path"
          d="M100,350 
             C120,150 350,150 300,350 
             C250,550 500,500 550,350 
             C600,200 800,200 750,400 
             C700,600 900,450 900,300"
           style={{ stroke: 'rgba(255, 255, 255, 0.8)', strokeWidth: 2, filter: 'blur(1px)' }}
        />
        
        {/* Underline swoosh */}
        <path
          className="signature-path-secondary"
          d="M150,500 Q500,600 850,450"
        />
      </svg>
      <div className="signature-vignette"></div>
    </div>
  );
};