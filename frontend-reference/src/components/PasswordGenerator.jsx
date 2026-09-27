import React, { useState } from 'react';
import { generatePassword, checkPasswordStrength, passwordOptions } from '../utils/passwordGenerator';

const PasswordGenerator = ({ onPasswordGenerated }) => {
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [options, setOptions] = useState(passwordOptions.strong);
  const [showOptions, setShowOptions] = useState(false);

  const handleGenerate = () => {
    const password = generatePassword(options);
    setGeneratedPassword(password);
    onPasswordGenerated(password);
  };

  const handlePresetChange = (preset) => {
    setOptions(passwordOptions[preset]);
  };

  const handleOptionChange = (key, value) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const strength = checkPasswordStrength(generatedPassword);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">🔐 Password Generator</h3>
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {showOptions ? 'Hide Options' : 'Show Options'}
        </button>
      </div>

      {/* Preset Options */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => handlePresetChange('strong')}
          className={`px-3 py-1 text-xs rounded ${
            options.length === 16 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Strong
        </button>
        <button
          type="button"
          onClick={() => handlePresetChange('medium')}
          className={`px-3 py-1 text-xs rounded ${
            options.length === 12 && !options.includeSymbols ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Medium
        </button>
        <button
          type="button"
          onClick={() => handlePresetChange('simple')}
          className={`px-3 py-1 text-xs rounded ${
            options.length === 10 && !options.excludeSimilar ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Simple
        </button>
      </div>

      {/* Advanced Options */}
      {showOptions && (
        <div className="space-y-3 mb-4 p-3 bg-white rounded border">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Length: {options.length}</label>
            <input
              type="range"
              min="8"
              max="32"
              value={options.length}
              onChange={(e) => handleOptionChange('length', parseInt(e.target.value))}
              className="w-20"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={options.includeUppercase}
                onChange={(e) => handleOptionChange('includeUppercase', e.target.checked)}
                className="mr-2"
              />
              Uppercase
            </label>
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={options.includeLowercase}
                onChange={(e) => handleOptionChange('includeLowercase', e.target.checked)}
                className="mr-2"
              />
              Lowercase
            </label>
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={options.includeNumbers}
                onChange={(e) => handleOptionChange('includeNumbers', e.target.checked)}
                className="mr-2"
              />
              Numbers
            </label>
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={options.includeSymbols}
                onChange={(e) => handleOptionChange('includeSymbols', e.target.checked)}
                className="mr-2"
              />
              Symbols
            </label>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={handleGenerate}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition duration-200"
        >
          🎲 Generate Password
        </button>
        {generatedPassword && (
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(generatedPassword)}
            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg text-sm transition duration-200"
            title="Copy to clipboard"
          >
            📋
          </button>
        )}
      </div>

      {/* Generated Password Display */}
      {generatedPassword && (
        <div className="space-y-2">
          <div className="bg-white border border-gray-300 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-gray-800 break-all">
                {generatedPassword}
              </code>
            </div>
          </div>

          {/* Password Strength Indicator */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Strength:</span>
              <span className={`font-medium text-${strength.color}-600`}>
                {strength.strength.toUpperCase()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  strength.color === 'green' ? 'bg-green-500' :
                  strength.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${(strength.score / 8) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              Score: {strength.score}/8
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordGenerator;
