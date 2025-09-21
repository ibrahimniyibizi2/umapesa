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
      const goalAmount = parseFloat(formData.goalAmount);
      if (goalAmount <= 0) {
        setError('Goal amount must be greater than 0');
        return;
      }

      if (formData.title.length < 10) {
        setError('Campaign title must be at least 10 characters long');
        return;
      }

      if (formData.description.length < 50) {
        setError('Campaign description must be at least 50 characters long');
        return;
      }

      // Upload image if a new file is selected
      let imageUrl = formData.imageUrl || '';
      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (!uploadedUrl) {
          setLoading(false);
          return;
        }
        imageUrl = uploadedUrl;
      }

      // First, create the campaign in the database
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          goal_amount: parseFloat(formData.goalAmount),
          currency: formData.currency,
          end_date: formData.endDate || null,
          image_url: imageUrl,
          withdrawal_number: formData.withdrawalNumber,
          withdrawal_method: formData.withdrawalMethod,
          is_active: formData.isActive
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create campaign');
      }

      const data = await response.json();

      // If campaign creation is successful, test the withdrawal with 1 MZN
      // This is just to verify the withdrawal number is valid
      // In production, you might want to make this optional or handle it differently
      try {
        const withdrawalResult = await makeWithdrawal(
          formData.withdrawalNumber,
          1, // Test with 1 MZN
          formData.withdrawalMethod
        );

        if (!withdrawalResult.success) {
          // If withdrawal test fails, delete the campaign and show error
          await fetch(`/api/campaigns/${data.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${user?.token}`
            }
          });
          
          throw new Error(withdrawalResult.error || 'Failed to verify withdrawal number');
        }
      } catch (error) {
        console.error('Withdrawal test failed:', error);
        throw new Error('Failed to verify withdrawal number. Please check the number and try again.');
      }

      if (data) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/campaign/${data.id}`);
        }, 2000);
      } else {
        setError('Failed to create campaign. Please try again.');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      setError(error instanceof Error ? error.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    try {
      setIsUploading(true);
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        setFormData(prev => ({ ...prev, imageUrl }));
        setPreviewUrl(URL.createObjectURL(file));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData(prev => ({
      ...prev,
      imageUrl: ''
    }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Created!</h2>
          <p className="text-gray-600 mb-6">
            Your fundraising campaign has been successfully created. You'll be redirected to your campaign page shortly.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

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
                {/* Campaign Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Heart className="w-5 h-5 mr-2" />
                    Campaign Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Campaign Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter a compelling campaign title"
                        maxLength={100}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.title.length}/100 characters (minimum 10)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Campaign Description *
                      </label>
                      <textarea
                        name="description"
                        required
                        rows={6}
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tell your story. Explain why this campaign matters and how the funds will be used."
                        maxLength={1000}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.description.length}/1000 characters (minimum 50)
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Withdrawal Number *
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            name="withdrawalNumber"
                            required
                            value={formData.withdrawalNumber}
                            onChange={handleChange}
                            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 841234567"
                            pattern="[0-9]{8,15}"
                            title="Please enter a valid phone number (8-15 digits)"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          The number where you'll receive the funds
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Campaign Image (Optional)
                        </label>
                      
                      {previewUrl ? (
                        <div className="mt-2 relative">
                          <img
                            src={previewUrl}
                            alt="Campaign preview"
                            className="h-48 w-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                            title="Remove image"
                          >
                            <X className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                          <div className="space-y-1 text-center">
                            <div className="flex text-sm text-gray-600 justify-center">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                              >
                                <span>Upload an image</span>
                                <input
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF up to 5MB
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Hidden URL input for backward compatibility */}
                      <input
                        type="hidden"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Funding Goal */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Funding Goal
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Goal Amount *
                      </label>
                      <input
                        type="number"
                        name="goalAmount"
                        required
                        min="100"
                        step="0.01"
                        value={formData.goalAmount}
                        onChange={handleChange}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency *
                      </label>
                      <select
                        name="currency"
                        required
                        value={formData.currency}
                        onChange={handleChange}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="MZN">MZN - Mozambican Metical</option>
                        <option value="RWF">RWF - Rwandan Franc</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Campaign Duration */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Campaign Duration
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty for an ongoing campaign
                    </p>
                  </div>
                </div>

                {/* Withdrawal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Withdrawal Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Withdrawal Number *
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          name="withdrawalNumber"
                          required
                          value={formData.withdrawalNumber}
                          onChange={handleChange}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 841234567"
                          pattern="[0-9]{8,9}"
                          title="Please enter a valid Mozambican phone number (8-9 digits)"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        The number where you'll receive the funds (Mozambican number)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Money Provider *
                      </label>
                      <select
                        name="withdrawalMethod"
                        required
                        value={formData.withdrawalMethod}
                        onChange={handleChange}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="mcel">mCel M-Pesa</option>
                        <option value="vodacom">Vodacom M-Pesa</option>
                      </select>
                    </div>
                  </div>
                </div>

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
            </form>
          </div>
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
          </div>  {/* closes the space-y-6 div */}
        </div>    {/* closes the grid */}
      </div>      {/* closes the max-w-4xl container */}
    </div>        {/* closes the min-h-screen container */}
  );
}