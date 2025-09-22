import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { UploadProgress } from './UploadProgress';

interface ImageUploaderProps {
  onFileUploaded: (file: File) => void;
  onUploadProgress?: (progress: number) => void;
  maxSizeMB?: number;
  acceptedFileTypes?: string[];
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onFileUploaded,
  onUploadProgress,
  maxSizeMB = 5,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = '',
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file type
      if (!acceptedFileTypes.includes(file.type)) {
        setError(`Unsupported file type. Please upload: ${acceptedFileTypes.join(', ')}`);
        return;
      }

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File is too large. Maximum size is ${maxSizeMB}MB`);
        return;
      }

      setError(null);
      const reader = new FileReader();
      
      reader.onload = () => {
        setPreview(reader.result as string);
        // Simulate upload progress
        setIsUploading(true);
        let progress = 0;
        const interval = setInterval(() => {
          progress += 5;
          setUploadProgress(progress);
          if (onUploadProgress) {
            onUploadProgress(progress);
          }
          if (progress >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            onFileUploaded(file);
          }
        }, 50);
      };
      
      reader.readAsDataURL(file);
    },
    [acceptedFileTypes, maxSizeMB, onFileUploaded, onUploadProgress]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.join(','),
    maxFiles: 1,
  });

  const removeImage = () => {
    setPreview(null);
    setUploadProgress(0);
    setError(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-cover rounded-lg"
          />
          {isUploading && (
            <div className="mt-2">
              <UploadProgress
                progress={uploadProgress}
                fileName="Uploading..."
                fileSize={0}
              />
            </div>
          )}
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            aria-label="Remove image"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-2">
            <PhotoIcon className="h-12 w-12 text-gray-400" />
            <div className="text-sm text-gray-600">
              {isDragActive ? (
                <p>Drop the image here</p>
              ) : (
                <p>Drag & drop an image here, or click to select</p>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {acceptedFileTypes.join(', ')} (max {maxSizeMB}MB)
            </p>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default ImageUploader;
