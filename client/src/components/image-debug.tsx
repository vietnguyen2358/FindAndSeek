
import React from 'react';

export function ImageDebug() {
  return (
    <div className="p-4 border border-red-500 rounded">
      <h3 className="text-lg font-bold">Image Debug</h3>
      <p className="mb-2">Testing image loading from public directory:</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p>Direct path: /images/test-camera.png</p>
          <img 
            src="/images/test-camera.png" 
            alt="Test Camera" 
            className="w-full h-40 object-cover rounded border"
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/200x150?text=Image+Error";
              console.error("Failed to load image from public dir");
            }}
          />
        </div>
        <div>
          <p>Relative path: ./images/test-camera.png</p>
          <img 
            src="./images/test-camera.png" 
            alt="Test Camera" 
            className="w-full h-40 object-cover rounded border"
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/200x150?text=Image+Error";
              console.error("Failed to load image with relative path");
            }}
          />
        </div>
      </div>
    </div>
  );
}
