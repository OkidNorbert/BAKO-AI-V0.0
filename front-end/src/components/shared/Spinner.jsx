import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const Spinner = ({ size = 'md', center = false }) => {
  const { isDarkMode } = useTheme();
  
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4'
  };
  
  const spinnerClass = `${sizeClasses[size]} animate-spin rounded-full ${
    isDarkMode 
      ? 'border-t-blue-400 border-r-transparent border-b-blue-400 border-l-transparent' 
      : 'border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent'
  }`;
  
  if (center) {
    return (
      <div className="flex justify-center items-center my-4">
        <div className={spinnerClass}></div>
      </div>
    );
  }
  
  return <div className={spinnerClass}></div>;
};

export default Spinner; 