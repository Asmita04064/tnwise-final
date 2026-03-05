/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { Translation } from '../types';

interface CameraScreenProps {
  t: Translation;
  title?: string;
  isBlood?: boolean;
  onCapture: (image: string) => void;
  onCancel: () => void;
}

export default function CameraScreen({ t, title, isBlood = false, onCapture, onCancel }: CameraScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camError, setCamError] = useState<string | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error('Error accessing camera:', err);
        setCamError(err.message || 'Unable to access camera.');
      }
    }
    setupCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = canvas.toDataURL('image/jpeg');
        onCapture(image);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      <div className="relative flex-1 overflow-hidden">
        {camError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-6 text-center">
            <p className="mb-4">{camError}</p>
            <p className="mb-4 text-sm">
              Make sure the browser has camera permission and you are using https or localhost.
            </p>
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-emerald-600 rounded font-bold"
            >
              {t.uploadImage}
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        

        <button
          onClick={onCancel}
          className="absolute top-6 right-6 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm"
        >
          <X size={24} />
        </button>
      </div>

      <div className="bg-slate-900 p-8 flex justify-center items-center">
        <button
          onClick={handleCapture}
          className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-slate-700 active:scale-90 transition-transform"
        >
          <div className={`w-16 h-16 ${isBlood ? 'bg-red-600' : 'bg-emerald-600'} rounded-full flex items-center justify-center text-white`}>
            <Camera size={32} />
          </div>
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
