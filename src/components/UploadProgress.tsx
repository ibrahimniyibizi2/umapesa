import React from 'react';

interface UploadProgressProps {
  progress: number;
  fileName: string;
  fileSize: number;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  fileName,
  fileSize,
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-blue-600 h-2.5 rounded-full"
        style={{ width: `${progress}%` }}
      />
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>{fileName}</span>
        <span>{formatFileSize(fileSize)}</span>
      </div>
      <div className="text-right text-xs text-gray-500">{progress}%</div>
    </div>
  );
};

export default UploadProgress;
