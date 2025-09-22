import { useState, useCallback } from 'react';

interface UseFileUploadOptions {
  maxSizeMB?: number;
  acceptedFileTypes?: string[];
  onUploadProgress?: (progress: number) => void;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const {
    maxSizeMB = 5,
    acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp'],
    onUploadProgress,
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const validateFile = useCallback(
    (fileToValidate: File): boolean => {
      if (!acceptedFileTypes.includes(fileToValidate.type)) {
        setError(`Unsupported file type. Please upload: ${acceptedFileTypes.join(', ')}`);
        return false;
      }

      if (fileToValidate.size > maxSizeMB * 1024 * 1024) {
        setError(`File is too large. Maximum size is ${maxSizeMB}MB`);
        return false;
      }

      return true;
    },
    [acceptedFileTypes, maxSizeMB]
  );

  const handleFileChange = useCallback(
    (selectedFile: File) => {
      setError(null);
      
      if (!validateFile(selectedFile)) {
        return false;
      }

      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      
      return true;
    },
    [validateFile]
  );

  const uploadFile = useCallback(
    async (uploadUrl: string, additionalData: Record<string, string | number | boolean | Blob | File> = {}) => {
      if (!file) {
        setError('No file selected');
        return null;
      }

      setIsUploading(true);
      setProgress(0);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      
      // Append additional data if provided
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value != null) {
          // Check if the value is a Blob or File
          const isBlob = value instanceof Blob;
          const isFile = typeof File !== 'undefined' && Object.prototype.toString.call(value) === '[object File]';
          
          if (isBlob || isFile) {
            formData.append(key, value as Blob);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      try {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress(percentComplete);
            if (onUploadProgress) {
              onUploadProgress(percentComplete);
            }
          }
        };

        const response = await new Promise((resolve, reject) => {
          xhr.open('POST', uploadUrl, true);
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch {
                resolve(xhr.responseText);
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };
          
          xhr.onerror = () => {
            reject(new Error('Network error during file upload'));
          };
          
          xhr.send(formData);
        });

        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
        setError(errorMessage);
        console.error('Upload error:', errorMessage);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [file, onUploadProgress]
  );

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setProgress(0);
    setError(null);
    setIsUploading(false);
  }, []);

  return {
    file,
    preview,
    isUploading,
    progress,
    error,
    handleFileChange,
    uploadFile,
    reset,
  };
};

export default useFileUpload;