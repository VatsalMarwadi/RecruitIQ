// components/Loader.jsx
import React from 'react';

export const Loader = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gray-50">
    <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
    <p className="mt-4 text-gray-500 text-sm">{text}</p>
  </div>
);

export default Loader;