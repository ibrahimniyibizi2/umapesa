// Demo API Service - No real backend calls
const API_BASE_URL = '/api';

class ApiService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('umapesa_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private static async handleResponse(response: Response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
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

  static async login(email: string, password: string) {
    // Demo login - any email + any password works
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

  static async updateProfile(userData: any) {
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
  static async createTransaction(transactionData: any) {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(transactionData)
    });
    
    return await this.handleResponse(response);
  }

  static async getUserTransactions() {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    
    return await this.handleResponse(response);
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

  static async createCampaign(campaignData: any) {
    // Demo campaign creation - always succeeds
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
    
    const newCampaignId = 'campaign-' + Date.now();
    
    return {
      success: true,
      campaignId: newCampaignId,
      message: 'Campaign created successfully'
    };
  }

  static async contributeToCampaign(campaignId: string, contributionData: any) {
    // Demo contribution - always succeeds
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    
    const contributionId = 'contrib-' + Date.now();
    
    return {
      success: true,
      contributionId: contributionId,
      message: 'Contribution successful'
    };
  }

  // Exchange rates endpoint
  static async getExchangeRates() {
    const response = await fetch(`${API_BASE_URL}/exchange-rates`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    return await this.handleResponse(response);
  }

  // Logout
  static logout() {
    localStorage.removeItem('umapesa_token');
    localStorage.removeItem('umapesa_user');
  }
}

export default ApiService;