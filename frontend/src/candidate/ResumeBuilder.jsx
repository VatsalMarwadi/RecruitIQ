import React, { useState } from 'react';

export const ResumeBuilder = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Resume Builder</h1>
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Complete Your Profile</h3>
          <p className="text-gray-500 text-sm mb-4">Fill in all sections to build a complete resume</p>
          <div className="space-y-2">
            {['Personal Information', 'Education', 'Experience', 'Skills', 'Projects', 'Certifications', 'Languages'].map((section) => (
              <div key={section} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{section}</span>
                <span className="text-xs text-blue-600">Incomplete</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};