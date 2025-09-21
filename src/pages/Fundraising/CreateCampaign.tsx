import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Heart } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { uploadImage } from '@/utils/storage';

export default function CreateCampaign() {
  const navigate = useNavigate();
  useAuth(); // We still call the hook for its side effects
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalAmount: '',
    currency: 'MZN' as 'MZN' | 'RWF',
    withdrawalNumber: '',
    withdrawalMethod: '',
    endDate: '',
    imageUrl: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (file: File) => {
    if (!file) {
      console.error('No file provided');
      return;
    }

    console.log('File selected:', file.name, 'Type:', file.type, 'Size:', file.size);

    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Please upload a valid image file (PNG, JPG, GIF)';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = 'File size should be less than 5MB';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      setError('');
      setIsUploading(true);
      console.log('Starting image upload...');
      
      const imageUrl = await uploadImage(file);
      console.log('Upload response:', { imageUrl });
      
      if (imageUrl) {
        console.log('Image uploaded successfully, URL:', imageUrl);
        setFormData(prev => ({ ...prev, imageUrl }));
        // Create a preview URL from the file
        const preview = URL.createObjectURL(file);
        console.log('Created preview URL:', preview);
        setPreviewUrl(preview);
      }
    } catch (error) {
      console.error('Error in handleImageUpload:', error);
      const errorMsg = error instanceof Error 
        ? `Failed to upload image: ${error.message}` 
        : 'An unknown error occurred during upload';
      setError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setPreviewUrl('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setError('');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
      // Reset the input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClickUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  // Adding proper types to parameters and variables
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    try {
      // Submit logic here
      setSuccess(true);
    } catch (error) {
      console.error('Error creating campaign:', error);
      setError('Failed to create campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-green-200">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Created Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your fundraising campaign has been created and is now live. Share it with your network to start receiving donations.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/fundraising')}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Campaigns
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full text-blue-600 hover:text-blue-700"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Heart className="w-5 h-5 mr-2" />
            Campaign Details
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="E.g., Help me pay for medical bills"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell your story..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdrawal Number *
                  </label>
                  <input
                    type="tel"
                    name="withdrawalNumber"
                    value={formData.withdrawalNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={formData.withdrawalMethod === 'mcel' ? '84xxxxxxx' : formData.withdrawalMethod === 'baton' ? '86xxxxxxx' : '85xxxxxxx'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Network Provider *
                  </label>
                  <select
                    name="withdrawalMethod"
                    value={formData.withdrawalMethod}
                    onChange={handleChange}
                    title="Select your network provider"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="vodacom">Vodacom Mozambique</option>
                    <option value="ntm">MTN Rwanda</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    aria-label="Campaign currency"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="MZN">MZN (Mozambican Metical)</option>
                    <option value="RWF">RWF (Rwandan Franc)</option>
                  </select>
                </div>
              </div>

              {/* Campaign Image */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Image</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                  <div 
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleClickUpload}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                      ) : (
                        <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                      )}
                      {isUploading ? (
                        <p className="text-sm text-gray-500">Uploading...</p>
                      ) : (
                        <>
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 5MB)</p>
                        </>
                      )}
                    </div>
                    <input 
                      ref={fileInputRef}
                      id="dropzone-file"
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </div>
                </div>

                  {previewUrl && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        title="Remove Image"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {error && (
                    <p className="text-red-600 text-sm mt-2">
                      {error}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Creating Campaign...' : 'Create Campaign'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips for a Successful Campaign</h3>
          <ul className="list-disc list-inside space-y-2">
            <li className="text-gray-700">
              <span className="font-semibold">Set a clear goal:</span> Define a specific amount of money you need to raise and what it will be used for.
            </li>
            <li className="text-gray-700">
              <span className="font-semibold">Tell your story:</span> Share why you are raising funds and how it will impact your life or project.
            </li>
            <li className="text-gray-700">
              <span className="font-semibold">Use high-quality images:</span> A clear and compelling image can make your campaign more appealing.
            </li>
            <li className="text-gray-700">
              <span className="font-semibold">Promote your campaign:</span> Share it on social media, via email, and other channels to reach potential donors.
            </li>
            <li className="text-gray-700">
              <span className="font-semibold">Thank your donors:</span> Show appreciation to those who contribute to your campaign.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
