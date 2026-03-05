import React from 'react';
import logoImage from '../assets/logo.png';

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>        
      <img
        src={logoImage}
        alt="NALAM THEDI LABS logo"
        className="w-full h-full object-contain"
      />
    </div>
  );
}
