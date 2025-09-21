import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  DollarSign, 
  Calendar, 
  X, 
  AlertCircle, 
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { uploadImage } from '@/utils/storage';
import { makeWithdrawal, validatePhoneNumber } from '../../utils/nethongaApi';

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalAmount: '',
    currency: 'MZN' as 'MZN' | 'RWF',
    endDate: '',
    imageUrl: '',
    withdrawalNumber: '',
    withdrawalMethod: 'mcel' as 'mcel' | 'vodacom',
    isActive: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate withdrawal number based on provider
    if (formData.withdrawalNumber) {
      if (!validatePhoneNumber(formData.withdrawalNumber, formData.withdrawalMethod)) {
        setError(`Invalid ${formData.withdrawalMethod === 'mcel' ? 'mCel' : 'Vodacom'} number. Please check the format.`);
        return;
      }
    } else {
      setError('Withdrawal number is required');
      return;
    }
    
    setLoading(true);
    
    try {
      // Handle image upload if a file is selected
      if (selectedFile) {
        setIsUploading(true);
        const imageUrl = await uploadImage(selectedFile);
        formData.imageUrl = imageUrl;
        setIsUploading(false);
      }
      
      // Create campaign logic here
      // const response = await createCampaign(formData);
      
      setSuccess(true);
      setLoading(false);
      
      // Redirect to success page or show success message
      setTimeout(() => {
        navigate('/campaigns');
      }, 3000);
      
    } catch (err) {
      console.error('Error creating campaign:', err);
      setError('Failed to create campaign. Please try again.');
      setLoading(false);
      setIsUploading(false);
    }
  };

  // Handle file selection for image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Success state
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 mb-4">Creating your campaign...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Fundraising Campaign</h1>
          <p className="text-gray-600">
            Start a campaign to raise funds for causes that matter to you and your community.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Campaign Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Campaign Title */}
                <div className="mb-6">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter a title for your campaign"
                    required
                  />
                </div>

                {/* Campaign Description */}
                <div className="mb-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell your story..."
                    required
                  />
                </div>

                {/* Goal Amount */}
                <div className="mb-6">
                  <label htmlFor="goalAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Fundraising Goal
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">
                        {formData.currency}
                      </span>
                    </div>
                    <input
                      type="number"
                      id="goalAmount"
                      name="goalAmount"
                      value={formData.goalAmount}
                      onChange={handleInputChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                {/* End Date */}
                <div className="mb-6">
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Image Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Image
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {previewUrl ? (
                        <div className="relative">
                          <img src={previewUrl} alt="Campaign preview" className="mx-auto h-48 w-full object-cover rounded-md" />
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewUrl('');
                              setSelectedFile(null);
                            }}
                            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                          >
                            <X className="h-5 w-5 text-gray-500" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                            >
                              <span>Upload a file</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                onChange={handleFileChange}
                                accept="image/*"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Withdrawal Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Withdrawal Information</h3>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="withdrawalMethod" className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        id="withdrawalMethod"
                        name="withdrawalMethod"
                        value={formData.withdrawalMethod}
                        onChange={handleInputChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="mcel">mCel</option>
                        <option value="vodacom">Vodacom</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="withdrawalNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="withdrawalNumber"
                        name="withdrawalNumber"
                        value={formData.withdrawalNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder={formData.withdrawalMethod === 'mcel' ? '82XXXXXXX' : '84XXXXXXX'}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading || isUploading}
                    className={`w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      (loading || isUploading) ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isUploading ? 'Uploading Image...' : loading ? 'Creating Campaign...' : 'Create Campaign'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Campaign Preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Preview</h3>
              
              <div className="space-y-4">
                {previewUrl ? (
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={previewUrl} 
                      alt="Campaign" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">Campaign image preview</span>
                  </div>
                )}
                
                <h4 className="text-xl font-semibold text-gray-900">
                  {formData.title || 'Your Campaign Title'}
                </h4>
                
                <p className="text-gray-600">
                  {formData.description || 'Your campaign description will appear here.'}
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-gray-900">0 {formData.currency || 'MZN'}</span>
                    <span className="text-gray-600">
                      of {formData.goalAmount || '0'} {formData.currency || 'MZN'}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full w-0"></div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>0 contributors</span>
                    {formData.endDate && (
                      <span>
                        Ends {new Date(formData.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Tips for Success</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Use a compelling, clear title</li>
                <li>• Tell your story with emotion</li>
                <li>• Add a high-quality image</li>
                <li>• Set a realistic goal</li>
                <li>• Share regular updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
