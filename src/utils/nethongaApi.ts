interface WithdrawalResponse {
  success: boolean;
  id?: string;
  error?: string;
}

export const makeWithdrawal = async (
  phoneNumber: string, 
  amount: number, 
  method: 'mcel' | 'vodacom'
): Promise<WithdrawalResponse> => {
  try {
    // In a real app, you should get this from your environment variables
    const API_KEY = process.env.REACT_APP_NHONGA_API_KEY;
    
    if (!API_KEY) {
      throw new Error('Nhonga.net API key is not configured');
    }

    // Format phone number if needed (remove any non-digit characters)
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    
    // Validate amount (1-5000 MZN)
    if (amount < 1 || amount > 5000) {
      throw new Error('Amount must be between 1 and 5000 MZN');
    }

    const response = await fetch('https://nhonga.net/api/payment/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': API_KEY
      },
      body: JSON.stringify({
        phoneNumber: formattedPhone,
        amount: amount.toString(),
        method: method === 'mcel' ? 'Mpesa' : 'Mpesa' // Using Mpesa for both for now
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to process withdrawal');
    }

    return {
      success: true,
      id: data.id
    };
  } catch (error) {
    console.error('Withdrawal error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process withdrawal'
    };
  }
};

// Utility function to validate phone number based on provider
export const validatePhoneNumber = (phoneNumber: string, provider: 'mcel' | 'vodacom'): boolean => {
  // Remove any non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  if (provider === 'mcel') {
    return /^(82|83|84|86|87)\d{6,7}$/.test(cleanNumber);
  } else if (provider === 'vodacom') {
    return /^(84|85)\d{6,7}$/.test(cleanNumber);
  }
  
  return false;
};
