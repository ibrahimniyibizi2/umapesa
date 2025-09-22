import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';

interface CampaignFormData {
  title: string;
  description: string;
  goalAmount: string;
  currency: 'MZN' | 'RWF';
  withdrawalNumber: string;
  withdrawalMethod: string;
  endDate: string;
  imageUrl: string;
}

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { createCampaign } = useTransactions();
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    goalAmount: '',
    currency: 'MZN',
    endDate: '',
    imageUrl: '',
    withdrawalNumber: '',
    withdrawalMethod: 'm-pesa'
  });

  // We're not using useFileUpload hook anymore as we're handling files directly
  const resetImageUpload = useCallback(() => {
    setSelectedFile(null);
    setFormData(prev => ({
      ...prev,
      imageUrl: ''
    }));
  }, []);

  // Handle file upload
  const handleFileChange = useCallback(async (file: File) => {
    try {
      setError('');
      console.log('Uploading file:', file.name, file.type, file.size);
      
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      }
      
      // Check file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error('File is too large. Maximum size is 5MB.');
      }
      
      // Create a local URL for the file to display a preview
      const imageUrl = URL.createObjectURL(file);
      console.log('Created local URL for file:', imageUrl);
      
      // Store the file in the component state so we can upload it later with the form
      setSelectedFile(file);
      
      // Set the image URL in the form data
      setFormData(prev => ({
        ...prev,
        imageUrl: imageUrl // Store the data URL for preview
      }));
      
      return imageUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
      console.error('Error processing file:', error);
      setError(errorMessage);
      setFormData(prev => ({
        ...prev,
        imageUrl: ''
      }));
      return null;
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file drop
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileChange(e.dataTransfer.files[0]);
    }
  }, [handleFileChange]);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle click to upload
  const handleClickUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const validateForm = useCallback((): { isValid: boolean; error: string } => {
    if (!formData.title.trim()) return { isValid: false, error: 'Title is required' };
    if (!formData.description.trim()) return { isValid: false, error: 'Description is required' };
    if (!formData.goalAmount) return { isValid: false, error: 'Goal amount is required' };
    if (isNaN(Number(formData.goalAmount)) || Number(formData.goalAmount) <= 0) {
      return { isValid: false, error: 'Please enter a valid goal amount' };
    }
    if (!formData.endDate) return { isValid: false, error: 'End date is required' };
    if (new Date(formData.endDate).getTime() <= new Date().getTime()) {
      return { isValid: false, error: 'End date must be in the future' };
    }
    if (!formData.currency) return { isValid: false, error: 'Currency is required' };
    if (!formData.withdrawalNumber.trim()) {
      return { isValid: false, error: 'Withdrawal number is required' };
    }
    if (!formData.withdrawalMethod) {
      return { isValid: false, error: 'Withdrawal method is required' };
    }
    if (!formData.imageUrl) return { isValid: false, error: 'Please upload a campaign image' };
    
    return { isValid: true, error: '' };
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form data
      const { isValid, error } = validateForm();
      if (!isValid) {
        throw new Error(error);
      }

      let imageUrl = formData.imageUrl; // Use the preview URL as a fallback
      
      // Upload the file if one was selected
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append('image', selectedFile);
          
          const uploadResponse = await fetch('http://localhost:5000/api/campaigns/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to upload image');
          }
          
          const { filePath } = await uploadResponse.json();
          imageUrl = filePath;
          console.log('Image uploaded successfully:', imageUrl);
          
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw new Error('Failed to upload image. Please try again.');
        }
      }

      const campaignData = {
        title: formData.title,
        description: formData.description,
        goalAmount: Number(formData.goalAmount),
        currency: formData.currency,
        endDate: formData.endDate,
        imageUrl: imageUrl,
        withdrawalNumber: formData.withdrawalNumber,
        withdrawalMethod: formData.withdrawalMethod as 'm-pesa' | 'airtel-money' | 'mpamba'
      };

      console.log('Submitting campaign data:', campaignData);

      // Submit campaign data using the context
      const response = await createCampaign({
        title: campaignData.title,
        description: campaignData.description,
        goalAmount: campaignData.goalAmount,
        currency: campaignData.currency,
        endDate: campaignData.endDate,
        imageUrl: campaignData.imageUrl,
        withdrawalNumber: campaignData.withdrawalNumber,
        withdrawalMethod: campaignData.withdrawalMethod
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to create campaign');
      }
      
      setSuccess(true);
      setSuccessMessage('Campaign created successfully!');
      
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        goalAmount: '',
        currency: 'MZN',
        endDate: '',
        imageUrl: '',
        withdrawalNumber: '',
        withdrawalMethod: 'm-pesa'
      });
      
      // Reset the image upload
      resetImageUpload();
      
      // Navigate to the fundraising page
      console.log('Campaign created successfully, redirecting to:', '/fundraising');
      navigate('/fundraising');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create campaign';
      console.error('Error creating campaign:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [createCampaign, formData, navigate, resetImageUpload, validateForm, selectedFile]);

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Campaign Created Successfully!</h1>
          <p className="text-gray-600 mb-6">Your campaign is now live and ready to receive contributions.</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Another Campaign
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Create a Fundraising Campaign</h1>
          <p className="mt-2 text-sm text-gray-600">
            Fill out the form below to create your campaign and start raising funds
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Campaign Information</h2>
            <p className="mt-1 text-sm text-gray-500">Basic information about your campaign</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Campaign Title *
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="E.g., Help Build a School in Rural Area"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Tell your story and explain why you're raising funds"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="goalAmount" className="block text-sm font-medium text-gray-700">
                  Goal Amount *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">
                      {formData.currency === 'MZN' ? 'MZN' : 'RWF'}
                    </span>
                  </div>
                  <input
                    type="number"
                    name="goalAmount"
                    id="goalAmount"
                    value={formData.goalAmount}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-16 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                  Currency *
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="MZN">Mozambican Metical (MZN)</option>
                  <option value="RWF">Rwandan Franc (RWF)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                id="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                When would you like to end your fundraising campaign?
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Image *
              </label>
              <div className="flex items-center justify-center w-full">
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors w-full ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleClickUpload}
                >
                  <svg className="w-8 h-8 mb-4 text-gray-500 mx-auto" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mb-2">PNG, JPG, WEBP (MAX. 5MB)</p>
                  {formData.imageUrl && (
                    <div className="mt-2 text-sm text-green-600">
                      Image selected successfully!
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        await handleFileChange(e.target.files[0]);
                        // Reset the input value to allow selecting the same file again
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
              {error && formData.imageUrl === '' && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Withdrawal Information</h2>
            <p className="mt-1 text-sm text-gray-500">How would you like to receive the funds?</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="withdrawalMethod" className="block text-sm font-medium text-gray-700">
                Withdrawal Method *
              </label>
              <select
                id="withdrawalMethod"
                name="withdrawalMethod"
                value={formData.withdrawalMethod}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                required
              >
                <option value="">Select withdrawal method</option>
                <option value="mpesa">M-Pesa</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            <div>
              <label htmlFor="withdrawalNumber" className="block text-sm font-medium text-gray-700">
                {formData.withdrawalMethod === 'mpesa' ? 'Phone Number' : 
                 formData.withdrawalMethod === 'bank_transfer' ? 'Bank Account Number' : 'Email Address'} *
              </label>
              <input
                type="text"
                name="withdrawalNumber"
                id="withdrawalNumber"
                value={formData.withdrawalNumber}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder={formData.withdrawalMethod === 'mpesa' ? 'e.g., 84 123 4567' : 
                              formData.withdrawalMethod === 'bank_transfer' ? 'Bank account number' : 'your@email.com'}
                required
              />
            </div>
          </div>

          <div className="pt-5">
            <div className="flex justify-end">
              <button
                type="button"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => window.history.back()}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {loading ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaign;
