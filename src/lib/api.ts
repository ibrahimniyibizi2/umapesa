// Demo API Service - No real backend calls
const API_BASE_URL = '/api';

// Define interfaces
interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: 'mozambique' | 'rwanda';
  avatar?: string;
}

interface ContributionData {
  amount: number;
  currency: 'MZN' | 'RWF';
  contributorName?: string;
  message?: string;
  isAnonymous?: boolean;
  paymentMethod: string;
}

// Define Transaction interface
export interface Transaction {
  id: string;
  senderId: string;
  recipientEmail: string;
  recipientName: string;
  recipientPhone: string;
  recipientCountry: 'mozambique' | 'rwanda';
  amount: number;
  currency: 'MZN' | 'RWF';
  convertedAmount: number;
  convertedCurrency: 'MZN' | 'RWF';
  exchangeRate: number;
  fee: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  type: 'send' | 'receive';
  createdAt: string;
  completedAt?: string;
  reference: string;
  description?: string;
  paymentId?: string;
  paymentMethod?: string;
}

class ApiService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('umapesa_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private static async handleResponse(response: Response) {
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Invalid response from server');
    }
    
    if (!response.ok) {
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        error: data.message || 'Unknown error'
      });
      throw new Error(data.message || `API request failed with status ${response.status}`);
    }
    
    return data;
  }

  // Authentication endpoints
  static async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    country: 'mozambique' | 'rwanda';
  }) {
    // Demo registration - always succeeds
    return {
      success: true,
      token: 'demo-jwt-token',
      user: {
        id: 'demo-user-' + Date.now(),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        country: userData.country,
        role: 'user',
        isVerified: true,
        kycStatus: 'approved',
        createdAt: new Date().toISOString()
      }
    };
  }

  static async login(email: string, _password: string) {
    // _password is intentionally unused in this demo implementation
    // Using void to indicate this parameter is intentionally unused
    void _password;
    
    const isAdmin = email === 'admin@umapesa.com';
    
    return {
      success: true,
      token: 'demo-jwt-token',
      user: {
        id: isAdmin ? 'admin-user-id' : 'demo-user-id',
        email: email,
        firstName: isAdmin ? 'Admin' : 'Demo',
        lastName: isAdmin ? 'User' : 'User',
        phone: isAdmin ? '+258841234567' : '+258841234568',
        country: 'mozambique',
        role: isAdmin ? 'admin' : 'user',
        isVerified: true,
        kycStatus: 'approved',
        createdAt: new Date().toISOString()
      }
    };
  }

  static async getProfile() {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    
    return await this.handleResponse(response);
  }

  static async updateProfile(userData: UserProfile) {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    
    const data = await this.handleResponse(response);
    
    if (data.success) {
      // Update local storage
      const currentUser = JSON.parse(localStorage.getItem('umapesa_user') || '{}');
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('umapesa_user', JSON.stringify(updatedUser));
    }
    
    return data;
  }

  // Transaction endpoints
  static async createTransaction(transactionData: Omit<Transaction, 'id' | 'status' | 'createdAt' | 'reference' | 'type'>) {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(transactionData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create transaction: ${response.statusText}`);
      }
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Failed to create transaction:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  static async getUserTransactions() {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Failed to fetch transactions, returning empty array:', error);
      // Return empty array if API call fails
      return {
        success: true,
        transactions: [],
        isFallback: true
      };
    }
  }

  static async updateTransactionStatus(transactionId: string, status: string) {
    const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}/status`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    
    return await this.handleResponse(response);
  }

  // Campaign endpoints
  static async getCampaigns() {
    // Demo campaigns data
    return {
      success: true,
      campaigns: [
        {
          id: 'campaign-1',
          title: 'Emergency Medical Treatment for Maria',
          description: 'Maria needs urgent medical treatment for a serious condition. Your support can help save her life and give her family hope during this difficult time.',
          goalAmount: 50000,
          raisedAmount: 32500,
          currency: 'MZN',
          creatorId: 'demo-user-id',
          creatorName: 'João Silva',
          imageUrl: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=800',
          isActive: true,
          endDate: '2024-03-15T23:59:59Z',
          createdAt: '2024-01-15T10:00:00Z',
          contributions: [
            {
              id: 'contrib-1',
              campaignId: 'campaign-1',
              contributorName: 'Ana Costa',
              contributorPhone: '+258841234567',
              amount: 5000,
              currency: 'MZN',
              isAnonymous: false,
              message: 'Wishing Maria a speedy recovery!',
              paymentStatus: 'completed',
              createdAt: '2024-01-16T14:30:00Z'
            }
          ]
        },
        {
          id: 'campaign-2',
          title: 'School Supplies for Rural Children',
          description: 'Help provide essential school supplies and books for children in rural communities. Education is the key to breaking the cycle of poverty.',
          goalAmount: 25000,
          raisedAmount: 18750,
          currency: 'MZN',
          creatorId: 'user-2',
          creatorName: 'Maria Santos',
          imageUrl: 'https://images.pexels.com/photos/8613089/pexels-photo-8613089.jpeg?auto=compress&cs=tinysrgb&w=800',
          isActive: true,
          createdAt: '2024-01-20T08:00:00Z',
          contributions: []
        }
      ]
    };
  }

  static async getCampaignById(campaignId: string) {
    // Demo campaign by ID
    const campaigns = await this.getCampaigns();
    const campaign = campaigns.campaigns.find(c => c.id === campaignId);
    
    if (campaign) {
      return {
        success: true,
        campaign: campaign
      };
    } else {
      return {
        success: false,
        error: 'Campaign not found'
      };
    }
  }

  static async createCampaign(campaignData: {
    title: string;
    description: string;
    goalAmount: number;
    currency: 'MZN' | 'RWF';
    endDate?: string;
    imageUrl?: string;
    withdrawalNumber: string;
    withdrawalMethod: string;
  }) {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          title: campaignData.title,
          description: campaignData.description,
          goal_amount: Number(campaignData.goalAmount),
          currency: campaignData.currency,
          end_date: campaignData.endDate,
          image_url: campaignData.imageUrl,
          withdrawal_number: campaignData.withdrawalNumber,
          withdrawal_method: campaignData.withdrawalMethod,
          is_active: true
        })
      });
      
      const data = await this.handleResponse(response);
      
      return {
        success: true,
        campaignId: data.data.id,
        message: 'Campaign created successfully',
        data: data.data
      };
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create campaign');
    }
  }

  static async contributeToCampaign(_campaignId: string, _contributionData: ContributionData) {
    // Using void to indicate these parameters are intentionally unused in this demo
    void _campaignId;
    void _contributionData;
    // _campaignId and _contributionData are intentionally unused in this demo implementation
    // In a real implementation, these would be used to process the contribution
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, you would use the parameters like this:
    // const { amount, currency } = _contributionData;
    // const response = await fetch(`${API_BASE_URL}/campaigns/${_campaignId}/contribute`, {
    //   method: 'POST',
    //   headers: this.getAuthHeaders(),
    //   body: JSON.stringify({
    //     amount,
    //     currency,
    //     // ... other contribution data
    //   })
    // });
    // return await this.handleResponse(response);
    
    // For demo purposes, return a success response
    return {
      success: true,
      contributionId: `contrib-${Date.now()}`,
      message: 'Contribution successful',
      // In a real implementation, you might want to include more data from the response
      data: {
        campaignId: _campaignId,
        // ... other relevant data
      }
    };
  }

  // Exchange rates endpoint with fallback
  static async getExchangeRates() {
    try {
      const response = await fetch(`${API_BASE_URL}/exchange-rates`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
      }
      
      return await this.handleResponse(response);
    } catch (error) {
      console.warn('Using fallback exchange rates due to error:', error);
      // Return fallback rates if API call fails
      return {
        success: true,
        MZN_to_RWF: 18.5,
        RWF_to_MZN: 0.054,
        last_updated: new Date().toISOString(),
        isFallback: true
      };
    }
  }

  // Logout
  static logout() {
    localStorage.removeItem('umapesa_token');
    localStorage.removeItem('umapesa_user');
  }
}

export default ApiService;