// src/components/ImageUploader.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { XMarkIcon, PhotoIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import axios, { AxiosProgressEvent, AxiosError } from 'axios';
import { Accept } from 'react-dropzone';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  onUploadProgress?: (progress: number) => void;
  maxSize?: number;
  accept?: Accept;
  className?: string;
}

const DEFAULT_ACCEPT = {
  'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  onRemove,
  onUploadProgress,
  maxSize = MAX_SIZE,
  accept = DEFAULT_ACCEPT,
  className = '',
}) => {
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > maxSize) {
      const errorMsg = `File is too large. Max size: ${maxSize / 1024 / 1024}MB`;
      setUploadError(errorMsg);
      return;
    }

    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Show upload progress
      const config = {
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          onUploadProgress?.(percentCompleted);
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const response = await axios.post(`${API_BASE_URL}/campaigns/upload`, formData, config);
      
      if (response.data.success) {
        // Return the full URL to the uploaded image
        const imageUrl = `${API_BASE_URL.replace('/api', '')}${response.data.filePath}`;
        onChange(imageUrl);
      } else {
        throw new Error(response.data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof AxiosError 
        ? error.response?.data?.message || error.message
        : error instanceof Error 
          ? error.message
          : 'Failed to upload image. Please try again.';
      setUploadError(errorMessage);
    }
  }, [maxSize, onChange, onUploadProgress]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: Object.keys(accept).length > 0 ? accept : undefined,
    maxFiles: 1,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadError(null);
    onRemove();
  };

  if (value) {
    return (
      <div className={`relative group ${className}`}>
        <div className="relative rounded-lg overflow-hidden">
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            title="Remove image"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
        } ${className}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <div className="mx-auto h-12 w-12 text-gray-400">
            {isDragActive ? (
              <CloudArrowUpIcon className="w-full h-full" />
            ) : (
              <PhotoIcon className="w-full h-full" />
            )}
          </div>
          <div className="text-sm text-gray-600">
            {isDragActive ? (
              <p>Drop the image here</p>
            ) : (
              <>
                <p>
                  <span className="font-medium text-blue-600">Upload an image</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF up to {maxSize / 1024 / 1024}MB
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      {uploadError && (
        <p className="mt-2 text-sm text-red-600">{uploadError}</p>
      )}
    </div>
  );
};