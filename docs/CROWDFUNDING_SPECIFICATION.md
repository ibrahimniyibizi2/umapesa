# Crowdfunding Campaign System - Technical Specification

## Table of Contents
1. [System Overview](#system-overview)
2. [Core Requirements](#core-requirements)
3. [Campaign Management System](#campaign-management-system)
4. [Technical Architecture](#technical-architecture)
5. [API Specifications](#api-specifications)
6. [Database Schema](#database-schema)
7. [Integration Requirements](#integration-requirements)
8. [Security & Compliance](#security--compliance)

---

## System Overview

### Purpose
The UmaPesa Crowdfunding Campaign System enables users to create, manage, and contribute to fundraising campaigns across Mozambique and Rwanda, with automated fund management, social media integration, and comprehensive notification systems.

### Key Features
- Public campaign access without registration
- Automated funding and refund systems
- SMS notification system
- Social media integration with auto-generated meta tags
- 10% commission structure on all transactions
- Multi-currency support (MZN/RWF)

---

## Core Requirements

### 1. Public Campaign Access

#### 1.1 Functional Requirements
- **Public Visibility**: All active campaigns must be accessible without user authentication
- **Anonymous Contributions**: Users can contribute without creating accounts
- **Payment Processing**: Support for card payments and mobile money (M-Pesa, eMola)
- **Contribution Tracking**: Anonymous contributions tracked by phone number and email (optional)

#### 1.2 Technical Specifications
```typescript
interface PublicCampaignAccess {
  campaignId: string;
  publicUrl: string;
  isPubliclyVisible: boolean;
  allowAnonymousContributions: boolean;
  paymentMethods: PaymentMethod[];
}

interface AnonymousContribution {
  contributorName: string;
  contributorPhone: string;
  contributorEmail?: string;
  amount: number;
  currency: 'MZN' | 'RWF';
  isAnonymous: boolean;
  message?: string;
  paymentMethod: 'card' | 'mpesa' | 'emola';
}
```

#### 1.3 User Experience Flow
1. User discovers campaign via social media or direct link
2. Campaign page displays with full details and contribution form
3. User fills contribution form (name, phone, amount, optional email/message)
4. Payment method selection popup appears
5. User completes payment via Nhonga API
6. Contribution confirmation and receipt generation
7. Optional SMS notification to contributor

#### 1.4 Edge Cases & Error Handling
- **Invalid Campaign ID**: Display 404 page with suggested active campaigns
- **Inactive Campaigns**: Show campaign details but disable contributions
- **Payment Failures**: Retry mechanism with clear error messages
- **Duplicate Contributions**: Allow multiple contributions from same phone number

### 2. Automated Funding System

#### 2.1 Trigger Conditions
- **Goal Achievement**: When `raised_amount >= goal_amount`
- **Campaign Expiration**: When `end_date` is reached (if specified)
- **Manual Trigger**: Campaign owner can manually trigger withdrawal
- **Minimum Threshold**: Only trigger if raised amount > 100 MZN/RWF

#### 2.2 Process Flow
```sql
-- Automated funding trigger function
CREATE OR REPLACE FUNCTION trigger_automatic_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if goal is reached
  IF NEW.raised_amount >= NEW.goal_amount THEN
    -- Insert withdrawal request
    INSERT INTO withdrawal_requests (
      campaign_id,
      amount,
      status,
      trigger_type,
      created_at
    ) VALUES (
      NEW.id,
      NEW.raised_amount * 0.9, -- 10% commission deducted
      'pending',
      'goal_reached',
      NOW()
    );
    
    -- Send notification to campaign owner
    PERFORM send_goal_reached_notification(NEW.creator_id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 2.3 Technical Implementation
- **Database Triggers**: Automatic execution on campaign updates
- **Queue System**: Background job processing for withdrawals
- **API Integration**: Nhonga B2C API for fund transfers
- **Audit Trail**: Complete logging of all automated actions

#### 2.4 Error Handling
- **API Failures**: Retry mechanism with exponential backoff
- **Insufficient Funds**: Handle partial withdrawals
- **Invalid Phone Numbers**: Validation and correction prompts
- **Network Issues**: Queue system with persistence

### 3. Communication System

#### 3.1 SMS Notification Types

##### 3.1.1 Contributor Notifications
```typescript
interface ContributorSMS {
  type: 'contribution_confirmation' | 'campaign_update' | 'goal_reached';
  recipient: string; // Phone number
  campaignTitle: string;
  amount: number;
  currency: string;
  message: string;
}
```

**Templates:**
- **Contribution Confirmation**: "Thank you for contributing {amount} {currency} to '{campaignTitle}'. Your support makes a difference! - UmaPesa"
- **Goal Reached**: "Great news! The campaign '{campaignTitle}' you supported has reached its goal. Thank you for being part of this success! - UmaPesa"

##### 3.1.2 Campaign Owner Notifications
```typescript
interface OwnerSMS {
  type: 'new_contribution' | 'goal_reached' | 'expiration_warning' | 'withdrawal_complete';
  recipient: string;
  campaignTitle: string;
  details: Record<string, any>;
}
```

**Templates:**
- **New Contribution**: "New contribution of {amount} {currency} received for '{campaignTitle}'. Total raised: {totalRaised} {currency} - UmaPesa"
- **Goal Reached**: "Congratulations! Your campaign '{campaignTitle}' has reached its goal of {goalAmount} {currency}. Funds will be transferred shortly. - UmaPesa"
- **Expiration Warning**: "Your campaign '{campaignTitle}' expires in {hoursLeft} hours. Current raised: {raisedAmount} {currency} - UmaPesa"

#### 3.2 Technical Implementation
```typescript
class SMSService {
  async sendContributorNotification(data: ContributorSMS): Promise<boolean> {
    const message = this.generateTemplate(data.type, data);
    return await this.sendSMS(data.recipient, message);
  }
  
  async sendOwnerNotification(data: OwnerSMS): Promise<boolean> {
    const message = this.generateTemplate(data.type, data);
    return await this.sendSMS(data.recipient, message);
  }
  
  private async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    // Integration with SMS provider (e.g., Twilio, local SMS gateway)
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, message })
      });
      return response.ok;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }
}
```

### 4. Refund Mechanism

#### 4.1 Refund Triggers
- **Campaign Cancellation**: Owner manually cancels campaign
- **Fraud Detection**: System-detected fraudulent activity
- **Goal Not Reached**: Optional refund policy for failed campaigns
- **Contributor Request**: Individual contribution refunds (within 24 hours)

#### 4.2 Commission Structure
```typescript
interface RefundCalculation {
  originalAmount: number;
  commissionRate: 0.10; // 10%
  refundAmount: number; // originalAmount * 0.9
  commissionRetained: number; // originalAmount * 0.1
}

function calculateRefund(originalAmount: number): RefundCalculation {
  const commissionRetained = originalAmount * 0.10;
  const refundAmount = originalAmount - commissionRetained;
  
  return {
    originalAmount,
    commissionRate: 0.10,
    refundAmount,
    commissionRetained
  };
}
```

#### 4.3 Refund Process Flow
1. **Refund Initiation**: Trigger event occurs
2. **Contribution Analysis**: Identify all eligible contributions
3. **Refund Calculation**: Apply 10% commission deduction
4. **Payment Processing**: Process refunds via Nhonga API
5. **Notification System**: SMS to all affected contributors
6. **Audit Logging**: Complete transaction history

#### 4.4 Technical Implementation
```sql
-- Refund processing function
CREATE OR REPLACE FUNCTION process_campaign_refunds(campaign_uuid UUID)
RETURNS TABLE(
  contribution_id UUID,
  original_amount NUMERIC,
  refund_amount NUMERIC,
  status TEXT
) AS $$
BEGIN
  -- Update campaign status
  UPDATE campaigns 
  SET is_active = false, 
      status = 'refunded',
      updated_at = NOW()
  WHERE id = campaign_uuid;
  
  -- Process individual refunds
  RETURN QUERY
  WITH refund_calculations AS (
    SELECT 
      c.id as contribution_id,
      c.amount as original_amount,
      (c.amount * 0.9) as refund_amount,
      c.contributor_phone
    FROM contributions c
    WHERE c.campaign_id = campaign_uuid
      AND c.payment_status = 'completed'
  )
  INSERT INTO refund_transactions (
    contribution_id,
    original_amount,
    refund_amount,
    phone_number,
    status,
    created_at
  )
  SELECT 
    contribution_id,
    original_amount,
    refund_amount,
    contributor_phone,
    'pending',
    NOW()
  FROM refund_calculations
  RETURNING contribution_id, original_amount, refund_amount, status;
END;
$$ LANGUAGE plpgsql;
```

---

## Campaign Management System

### 1. Social Media Integration

#### 1.1 Auto-Generated Meta Tags
```typescript
interface CampaignMetaTags {
  title: string; // "Help [Campaign Title] - UmaPesa Crowdfunding"
  description: string; // First 160 characters of campaign description
  image: string; // Campaign image URL or default UmaPesa image
  url: string; // Canonical campaign URL
  type: 'website';
  siteName: 'UmaPesa';
}

function generateMetaTags(campaign: Campaign): CampaignMetaTags {
  return {
    title: `Help ${campaign.title} - UmaPesa Crowdfunding`,
    description: campaign.description.substring(0, 160) + '...',
    image: campaign.imageUrl || 'https://umapesa.com/default-campaign.jpg',
    url: `https://umapesa.com/campaign/${campaign.id}`,
    type: 'website',
    siteName: 'UmaPesa'
  };
}
```

#### 1.2 HTML Meta Tag Implementation
```html
<!-- Campaign page meta tags -->
<meta property="og:title" content="{campaign.metaTitle}" />
<meta property="og:description" content="{campaign.metaDescription}" />
<meta property="og:image" content="{campaign.metaImage}" />
<meta property="og:url" content="https://umapesa.com/campaign/{campaign.id}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="UmaPesa" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{campaign.metaTitle}" />
<meta name="twitter:description" content="{campaign.metaDescription}" />
<meta name="twitter:image" content="{campaign.metaImage}" />
```

### 2. Media Management

#### 2.1 Image Upload Specifications
```typescript
interface ImageUploadRequirements {
  maxFileSize: 5 * 1024 * 1024; // 5MB
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp'];
  minDimensions: { width: 800, height: 600 };
  maxDimensions: { width: 1920, height: 1080 };
  aspectRatio: '16:9' | '4:3' | '1:1'; // Recommended ratios
}

interface ImageProcessing {
  compression: boolean; // Auto-compress to optimize size
  thumbnailGeneration: boolean; // Generate multiple sizes
  watermark: boolean; // Optional UmaPesa watermark
}
```

#### 2.2 URL Validation Requirements
```typescript
function validateImageUrl(url: string): ValidationResult {
  const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|webp)(\?.*)?$/i;
  
  if (!urlPattern.test(url)) {
    return { valid: false, error: 'Invalid image URL format' };
  }
  
  // Additional checks
  return checkImageAccessibility(url);
}

async function checkImageAccessibility(url: string): Promise<ValidationResult> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    
    if (!contentType?.startsWith('image/')) {
      return { valid: false, error: 'URL does not point to an image' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Image URL is not accessible' };
  }
}
```

### 3. Contribution Process

#### 3.1 Phone Number Collection
```typescript
interface ContributionForm {
  contributorName: string; // Required
  contributorPhone: string; // Required, validated
  contributorEmail?: string; // Optional
  amount: number; // Required, min 1 MZN/RWF
  currency: 'MZN' | 'RWF'; // Auto-detected from campaign
  isAnonymous: boolean; // Default false
  message?: string; // Optional, max 500 characters
}

function validatePhoneNumber(phone: string, country: 'mozambique' | 'rwanda'): ValidationResult {
  const patterns = {
    mozambique: /^(\+258|258)?[0-9]{9}$/,
    rwanda: /^(\+250|250)?[0-9]{9}$/
  };
  
  const pattern = patterns[country];
  if (!pattern.test(phone)) {
    return { 
      valid: false, 
      error: `Invalid ${country} phone number format` 
    };
  }
  
  return { valid: true };
}
```

#### 3.2 Payment Popup Workflow
```typescript
interface PaymentPopupFlow {
  step1: 'contribution_form'; // User fills contribution details
  step2: 'payment_method_selection'; // Choose card/mobile money
  step3: 'payment_processing'; // Nhonga API integration
  step4: 'confirmation'; // Success/failure feedback
}

class PaymentPopupManager {
  async showPaymentMethods(contribution: ContributionForm): Promise<PaymentMethod> {
    const availableMethods = this.getAvailablePaymentMethods(contribution.currency);
    return await this.displayMethodSelection(availableMethods);
  }
  
  async processPayment(contribution: ContributionForm, method: PaymentMethod): Promise<PaymentResult> {
    switch (method.type) {
      case 'card':
        return await this.processCardPayment(contribution);
      case 'mobile_money':
        return await this.processMobilePayment(contribution, method);
      default:
        throw new Error('Unsupported payment method');
    }
  }
}
```

### 4. Campaign Lifecycle

#### 4.1 Automatic Withdrawal Process
```typescript
interface AutoWithdrawalConfig {
  triggerConditions: {
    goalReached: boolean;
    campaignExpired: boolean;
    manualTrigger: boolean;
  };
  processingDelay: number; // 24 hours after trigger
  commissionRate: 0.10;
  minimumAmount: 100; // MZN/RWF
}

class AutoWithdrawalService {
  async checkWithdrawalEligibility(campaignId: string): Promise<WithdrawalEligibility> {
    const campaign = await this.getCampaign(campaignId);
    const now = new Date();
    
    return {
      isEligible: this.evaluateEligibility(campaign, now),
      reason: this.getEligibilityReason(campaign, now),
      withdrawalAmount: campaign.raisedAmount * 0.9,
      commission: campaign.raisedAmount * 0.1
    };
  }
  
  async processAutoWithdrawal(campaignId: string): Promise<WithdrawalResult> {
    const eligibility = await this.checkWithdrawalEligibility(campaignId);
    
    if (!eligibility.isEligible) {
      throw new Error(`Withdrawal not eligible: ${eligibility.reason}`);
    }
    
    return await this.executeWithdrawal(campaignId, eligibility.withdrawalAmount);
  }
}
```

### 5. Owner Notifications

#### 5.1 3-Notification System (8-Hour Intervals)
```typescript
interface ExpirationNotificationSchedule {
  notification1: { hoursBeforeExpiry: 24, sent: boolean };
  notification2: { hoursBeforeExpiry: 16, sent: boolean };
  notification3: { hoursBeforeExpiry: 8, sent: boolean };
}

class ExpirationNotificationService {
  async scheduleNotifications(campaign: Campaign): Promise<void> {
    if (!campaign.endDate) return;
    
    const notifications = [
      { hours: 24, message: 'Your campaign expires in 24 hours' },
      { hours: 16, message: 'Your campaign expires in 16 hours' },
      { hours: 8, message: 'Your campaign expires in 8 hours' }
    ];
    
    for (const notification of notifications) {
      const sendTime = new Date(campaign.endDate.getTime() - (notification.hours * 60 * 60 * 1000));
      await this.scheduleNotification(campaign.id, sendTime, notification.message);
    }
  }
  
  async processScheduledNotifications(): Promise<void> {
    const pendingNotifications = await this.getPendingNotifications();
    
    for (const notification of pendingNotifications) {
      await this.sendExpirationWarning(notification);
      await this.markNotificationSent(notification.id);
    }
  }
}
```

---

## Technical Architecture

### 1. System Components

#### 1.1 Frontend Architecture
```typescript
// React Component Structure
src/
├── components/
│   ├── Campaign/
│   │   ├── CampaignCard.tsx
│   │   ├── CampaignDetail.tsx
│   │   ├── ContributionForm.tsx
│   │   └── PaymentPopup.tsx
│   ├── Payment/
│   │   ├── PaymentMethods.tsx
│   │   └── PaymentSuccess.tsx
│   └── Notifications/
│       └── SMSNotification.tsx
├── contexts/
│   ├── CampaignContext.tsx
│   ├── PaymentContext.tsx
│   └── NotificationContext.tsx
├── hooks/
│   ├── useCampaigns.ts
│   ├── usePayments.ts
│   └── useNotifications.ts
└── services/
    ├── campaignService.ts
    ├── paymentService.ts
    └── notificationService.ts
```

#### 1.2 Backend Architecture
```typescript
// API Route Structure
api/
├── campaigns/
│   ├── [id]/
│   │   ├── contribute.ts
│   │   ├── withdraw.ts
│   │   └── refund.ts
│   ├── create.ts
│   └── list.ts
├── payments/
│   ├── process.ts
│   ├── webhook.ts
│   └── status.ts
├── notifications/
│   ├── sms.ts
│   └── schedule.ts
└── admin/
    ├── campaigns.ts
    └── withdrawals.ts
```

### 2. Database Schema Extensions

#### 2.1 Additional Tables
```sql
-- Withdrawal requests table
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL,
  commission NUMERIC(15,2) NOT NULL,
  phone_number TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('mpesa', 'emola')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('goal_reached', 'expired', 'manual')),
  nhonga_transfer_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refund transactions table
CREATE TABLE refund_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id UUID NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
  original_amount NUMERIC(15,2) NOT NULL,
  refund_amount NUMERIC(15,2) NOT NULL,
  commission_retained NUMERIC(15,2) NOT NULL,
  phone_number TEXT NOT NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  nhonga_transfer_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification log table
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  contribution_id UUID REFERENCES contributions(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled notifications table
CREATE TABLE scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.2 Indexes for Performance
```sql
-- Withdrawal requests indexes
CREATE INDEX idx_withdrawal_requests_campaign_id ON withdrawal_requests(campaign_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_created_at ON withdrawal_requests(created_at);

-- Refund transactions indexes
CREATE INDEX idx_refund_transactions_contribution_id ON refund_transactions(contribution_id);
CREATE INDEX idx_refund_transactions_status ON refund_transactions(status);
CREATE INDEX idx_refund_transactions_phone_number ON refund_transactions(phone_number);

-- Notification logs indexes
CREATE INDEX idx_notification_logs_campaign_id ON notification_logs(campaign_id);
CREATE INDEX idx_notification_logs_recipient_phone ON notification_logs(recipient_phone);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at);

-- Scheduled notifications indexes
CREATE INDEX idx_scheduled_notifications_campaign_id ON scheduled_notifications(campaign_id);
CREATE INDEX idx_scheduled_notifications_scheduled_time ON scheduled_notifications(scheduled_time);
CREATE INDEX idx_scheduled_notifications_status ON scheduled_notifications(status);
```

---

## API Specifications

### 1. Campaign API Endpoints

#### 1.1 Public Campaign Access
```typescript
// GET /api/campaigns/public
interface PublicCampaignsResponse {
  campaigns: PublicCampaign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// GET /api/campaigns/public/[id]
interface PublicCampaignResponse {
  campaign: PublicCampaign;
  contributions: PublicContribution[];
  stats: {
    totalContributors: number;
    averageContribution: number;
    progressPercentage: number;
    daysRemaining: number | null;
  };
}
```

#### 1.2 Contribution API
```typescript
// POST /api/campaigns/[id]/contribute
interface ContributeRequest {
  contributorName: string;
  contributorPhone: string;
  contributorEmail?: string;
  amount: number;
  isAnonymous: boolean;
  message?: string;
  paymentMethod: 'card' | 'mpesa' | 'emola';
}

interface ContributeResponse {
  success: boolean;
  contributionId: string;
  paymentUrl?: string; // For card payments
  message: string;
}
```

#### 1.3 Withdrawal API
```typescript
// POST /api/campaigns/[id]/withdraw
interface WithdrawRequest {
  phoneNumber: string;
  amount: number;
  method: 'mpesa' | 'emola';
}

interface WithdrawResponse {
  success: boolean;
  withdrawalId: string;
  transferId?: string; // Nhonga transfer ID
  netAmount: number; // After 10% commission
  commission: number;
  message: string;
}
```

### 2. Payment Integration API

#### 2.1 Nhonga API Integration
```typescript
class NhongaPaymentService {
  // Card payment processing
  async createCardPayment(data: {
    amount: number;
    context: string;
    returnUrl: string;
    callbackUrl: string;
  }): Promise<NhongaPaymentResponse> {
    const response = await fetch('https://nhonga.net/api/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': process.env.NHONGA_API_KEY
      },
      body: JSON.stringify({
        ...data,
        currency: 'MZN',
        environment: 'prod'
      })
    });
    
    return await response.json();
  }
  
  // Mobile money payment processing
  async createMobilePayment(data: {
    method: 'mpesa' | 'emola';
    amount: number;
    context: string;
    phone: string;
    userEmail: string;
  }): Promise<NhongaMobileResponse> {
    const response = await fetch('https://nhonga.net/api/payment/mobile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': process.env.NHONGA_API_KEY
      },
      body: JSON.stringify(data)
    });
    
    return await response.json();
  }
  
  // B2C money transfer (withdrawals/refunds)
  async sendMoney(data: {
    phoneNumber: string;
    amount: number;
    method: 'Mpesa' | 'Emola';
  }): Promise<NhongaTransferResponse> {
    const response = await fetch('https://nhonga.net/api/payment/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': process.env.NHONGA_API_KEY
      },
      body: JSON.stringify({
        phoneNumber: data.phoneNumber,
        amount: data.amount.toString(),
        method: data.method
      })
    });
    
    return await response.json();
  }
}
```

### 3. Notification API

#### 3.1 SMS Service Integration
```typescript
class SMSNotificationService {
  async sendContributionConfirmation(data: {
    phoneNumber: string;
    campaignTitle: string;
    amount: number;
    currency: string;
  }): Promise<boolean> {
    const message = `Thank you for contributing ${data.amount} ${data.currency} to '${data.campaignTitle}'. Your support makes a difference! - UmaPesa`;
    
    return await this.sendSMS(data.phoneNumber, message);
  }
  
  async sendGoalReachedNotification(data: {
    phoneNumber: string;
    campaignTitle: string;
  }): Promise<boolean> {
    const message = `Great news! The campaign '${data.campaignTitle}' you supported has reached its goal. Thank you for being part of this success! - UmaPesa`;
    
    return await this.sendSMS(data.phoneNumber, message);
  }
  
  async sendExpirationWarning(data: {
    phoneNumber: string;
    campaignTitle: string;
    hoursLeft: number;
    raisedAmount: number;
    currency: string;
  }): Promise<boolean> {
    const message = `Your campaign '${data.campaignTitle}' expires in ${data.hoursLeft} hours. Current raised: ${data.raisedAmount} ${data.currency} - UmaPesa`;
    
    return await this.sendSMS(data.phoneNumber, message);
  }
  
  private async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    // Implementation depends on SMS provider
    // Could be Twilio, local SMS gateway, etc.
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, message })
      });
      
      return response.ok;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }
}
```

---

## Integration Requirements

### 1. Third-Party Services

#### 1.1 Nhonga Payment Gateway
- **API Key Management**: Secure storage of API credentials
- **Webhook Handling**: Process payment confirmations
- **Error Handling**: Retry mechanisms for failed payments
- **Rate Limiting**: Respect API rate limits

#### 1.2 SMS Service Provider
- **Provider Selection**: Choose reliable SMS gateway
- **Message Templates**: Standardized message formats
- **Delivery Tracking**: Monitor SMS delivery status
- **Cost Optimization**: Efficient message routing

#### 1.3 Image Storage Service
- **CDN Integration**: Fast image delivery
- **Image Processing**: Automatic optimization
- **Backup Strategy**: Redundant storage
- **Access Control**: Secure image URLs

### 2. Social Media Platforms

#### 2.1 Meta Tags Implementation
```html
<!-- Open Graph (Facebook, LinkedIn) -->
<meta property="og:title" content="{campaign.metaTitle}" />
<meta property="og:description" content="{campaign.metaDescription}" />
<meta property="og:image" content="{campaign.metaImage}" />
<meta property="og:url" content="{campaign.url}" />
<meta property="og:type" content="website" />

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{campaign.metaTitle}" />
<meta name="twitter:description" content="{campaign.metaDescription}" />
<meta name="twitter:image" content="{campaign.metaImage}" />

<!-- WhatsApp -->
<meta property="og:site_name" content="UmaPesa" />
<meta property="og:locale" content="pt_MZ" />
```

#### 2.2 Social Sharing Features
```typescript
interface SocialSharingService {
  generateShareUrl(platform: 'facebook' | 'twitter' | 'whatsapp' | 'linkedin', campaignUrl: string): string;
  trackSocialShares(campaignId: string, platform: string): Promise<void>;
  generateSocialPreview(campaignId: string): Promise<SocialPreview>;
}

class SocialSharingImplementation implements SocialSharingService {
  generateShareUrl(platform: string, campaignUrl: string): string {
    const encodedUrl = encodeURIComponent(campaignUrl);
    
    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${encodedUrl}`;
      case 'whatsapp':
        return `https://wa.me/?text=${encodedUrl}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      default:
        throw new Error('Unsupported platform');
    }
  }
}
```

---

## Security & Compliance

### 1. Data Protection

#### 1.1 Personal Information Handling
- **Phone Number Masking**: Display partial phone numbers publicly
- **Email Protection**: Optional email collection with privacy controls
- **Anonymous Contributions**: Support for anonymous donations
- **Data Retention**: Clear policies for data storage duration

#### 1.2 Payment Security
- **PCI Compliance**: Secure payment processing
- **API Key Security**: Encrypted storage of credentials
- **Transaction Logging**: Comprehensive audit trails
- **Fraud Detection**: Monitor for suspicious activities

### 2. Regulatory Compliance

#### 2.1 Financial Regulations
- **Money Transfer Licensing**: Compliance with local regulations
- **AML/KYC Requirements**: Anti-money laundering procedures
- **Transaction Reporting**: Required financial reporting
- **Tax Compliance**: Proper tax handling for commissions

#### 2.2 Data Privacy
- **GDPR Compliance**: European data protection standards
- **Local Privacy Laws**: Mozambique and Rwanda regulations
- **Consent Management**: Clear consent for data processing
- **Right to Deletion**: Data removal capabilities

### 3. System Security

#### 3.1 API Security
```typescript
// Rate limiting middleware
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

// Authentication middleware
const authenticateAPI = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || !validateAPIKey(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
};

// Input validation
const validateContribution = (req: Request, res: Response, next: NextFunction) => {
  const { amount, contributorPhone, contributorName } = req.body;
  
  if (!amount || amount < 1) {
    return res.status(400).json({ error: 'Invalid contribution amount' });
  }
  
  if (!contributorPhone || !validatePhoneNumber(contributorPhone)) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }
  
  if (!contributorName || contributorName.trim().length < 2) {
    return res.status(400).json({ error: 'Invalid contributor name' });
  }
  
  next();
};
```

#### 3.2 Database Security
```sql
-- Row Level Security policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Public campaign access
CREATE POLICY "Public campaigns are viewable by everyone" ON campaigns
  FOR SELECT USING (is_active = true);

-- Campaign owner access
CREATE POLICY "Campaign owners can manage their campaigns" ON campaigns
  FOR ALL USING (creator_id = auth.uid());

-- Contribution access
CREATE POLICY "Anyone can create contributions" ON contributions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Contributors can view their contributions" ON contributions
  FOR SELECT USING (
    contributor_email = auth.email() OR 
    contributor_phone = auth.phone()
  );

-- Withdrawal access
CREATE POLICY "Campaign owners can request withdrawals" ON withdrawal_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = campaign_id 
      AND campaigns.creator_id = auth.uid()
    )
  );
```

---

## Performance & Scalability

### 1. Database Optimization

#### 1.1 Query Optimization
```sql
-- Optimized campaign listing query
CREATE INDEX CONCURRENTLY idx_campaigns_active_created 
ON campaigns (is_active, created_at DESC) 
WHERE is_active = true;

-- Optimized contribution aggregation
CREATE MATERIALIZED VIEW campaign_stats AS
SELECT 
  c.id,
  c.title,
  c.goal_amount,
  COALESCE(SUM(contrib.amount), 0) as raised_amount,
  COUNT(contrib.id) as contribution_count,
  MAX(contrib.created_at) as last_contribution
FROM campaigns c
LEFT JOIN contributions contrib ON c.id = contrib.campaign_id 
  AND contrib.payment_status = 'completed'
WHERE c.is_active = true
GROUP BY c.id, c.title, c.goal_amount;

-- Refresh materialized view periodically
CREATE OR REPLACE FUNCTION refresh_campaign_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY campaign_stats;
END;
$$ LANGUAGE plpgsql;
```

#### 1.2 Caching Strategy
```typescript
class CacheService {
  private redis: Redis;
  
  async getCampaignStats(campaignId: string): Promise<CampaignStats | null> {
    const cached = await this.redis.get(`campaign:stats:${campaignId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const stats = await this.calculateCampaignStats(campaignId);
    await this.redis.setex(`campaign:stats:${campaignId}`, 300, JSON.stringify(stats)); // 5 min cache
    
    return stats;
  }
  
  async invalidateCampaignCache(campaignId: string): Promise<void> {
    await this.redis.del(`campaign:stats:${campaignId}`);
    await this.redis.del(`campaign:details:${campaignId}`);
  }
}
```

### 2. Background Job Processing

#### 2.1 Queue System Implementation
```typescript
import Bull from 'bull';

// Withdrawal processing queue
const withdrawalQueue = new Bull('withdrawal processing', {
  redis: { host: 'localhost', port: 6379 }
});

withdrawalQueue.process('process-withdrawal', async (job) => {
  const { withdrawalId } = job.data;
  
  try {
    const withdrawal = await getWithdrawalRequest(withdrawalId);
    const result = await processNhongaTransfer(withdrawal);
    
    await updateWithdrawalStatus(withdrawalId, 'completed', result.transferId);
    await sendWithdrawalNotification(withdrawal);
    
    return { success: true, transferId: result.transferId };
  } catch (error) {
    await updateWithdrawalStatus(withdrawalId, 'failed', null, error.message);
    throw error;
  }
});

// SMS notification queue
const smsQueue = new Bull('sms notifications', {
  redis: { host: 'localhost', port: 6379 }
});

smsQueue.process('send-sms', async (job) => {
  const { phoneNumber, message, type } = job.data;
  
  const result = await smsService.sendSMS(phoneNumber, message);
  
  await logNotification({
    phoneNumber,
    message,
    type,
    status: result.success ? 'sent' : 'failed',
    errorMessage: result.error
  });
  
  return result;
});
```

### 3. Monitoring & Analytics

#### 3.1 System Monitoring
```typescript
interface SystemMetrics {
  campaignMetrics: {
    totalActiveCampaigns: number;
    totalContributions: number;
    totalAmountRaised: number;
    averageContributionAmount: number;
  };
  paymentMetrics: {
    successfulPayments: number;
    failedPayments: number;
    paymentSuccessRate: number;
    averageProcessingTime: number;
  };
  systemMetrics: {
    apiResponseTime: number;
    databaseQueryTime: number;
    queueProcessingTime: number;
    errorRate: number;
  };
}

class MonitoringService {
  async collectMetrics(): Promise<SystemMetrics> {
    const [campaignMetrics, paymentMetrics, systemMetrics] = await Promise.all([
      this.getCampaignMetrics(),
      this.getPaymentMetrics(),
      this.getSystemMetrics()
    ]);
    
    return { campaignMetrics, paymentMetrics, systemMetrics };
  }
  
  async alertOnThresholds(metrics: SystemMetrics): Promise<void> {
    if (metrics.paymentMetrics.paymentSuccessRate < 0.95) {
      await this.sendAlert('Low payment success rate', metrics.paymentMetrics);
    }
    
    if (metrics.systemMetrics.errorRate > 0.05) {
      await this.sendAlert('High error rate detected', metrics.systemMetrics);
    }
  }
}
```

---

## Testing Strategy

### 1. Unit Testing

#### 1.1 Payment Processing Tests
```typescript
describe('PaymentService', () => {
  describe('processContribution', () => {
    it('should process card payment successfully', async () => {
      const contribution = {
        amount: 1000,
        contributorName: 'John Doe',
        contributorPhone: '+258841234567',
        paymentMethod: 'card'
      };
      
      const result = await paymentService.processContribution(contribution);
      
      expect(result.success).toBe(true);
      expect(result.paymentUrl).toBeDefined();
    });
    
    it('should handle payment failures gracefully', async () => {
      const contribution = {
        amount: -100, // Invalid amount
        contributorName: 'John Doe',
        contributorPhone: '+258841234567',
        paymentMethod: 'card'
      };
      
      await expect(paymentService.processContribution(contribution))
        .rejects.toThrow('Invalid contribution amount');
    });
  });
});
```

#### 1.2 Withdrawal Processing Tests
```typescript
describe('WithdrawalService', () => {
  describe('processWithdrawal', () => {
    it('should calculate commission correctly', () => {
      const amount = 1000;
      const result = withdrawalService.calculateWithdrawal(amount);
      
      expect(result.netAmount).toBe(900); // 90% of original
      expect(result.commission).toBe(100); // 10% commission
    });
    
    it('should validate phone numbers', () => {
      const validPhone = '841234567';
      const invalidPhone = '123';
      
      expect(withdrawalService.validatePhone(validPhone, 'mozambique')).toBe(true);
      expect(withdrawalService.validatePhone(invalidPhone, 'mozambique')).toBe(false);
    });
  });
});
```

### 2. Integration Testing

#### 2.1 API Endpoint Tests
```typescript
describe('Campaign API', () => {
  describe('POST /api/campaigns/:id/contribute', () => {
    it('should create contribution successfully', async () => {
      const response = await request(app)
        .post('/api/campaigns/test-campaign-id/contribute')
        .send({
          contributorName: 'Test User',
          contributorPhone: '+258841234567',
          amount: 500,
          paymentMethod: 'mpesa'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.contributionId).toBeDefined();
    });
  });
  
  describe('POST /api/campaigns/:id/withdraw', () => {
    it('should process withdrawal for campaign owner', async () => {
      const response = await request(app)
        .post('/api/campaigns/test-campaign-id/withdraw')
        .set('Authorization', 'Bearer valid-owner-token')
        .send({
          phoneNumber: '841234567',
          amount: 1000,
          method: 'mpesa'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.netAmount).toBe(900); // After 10% commission
    });
  });
});
```

### 3. End-to-End Testing

#### 3.1 Complete User Flows
```typescript
describe('Campaign Contribution Flow', () => {
  it('should complete full contribution process', async () => {
    // 1. Visit campaign page
    await page.goto('/campaign/test-campaign-id');
    
    // 2. Fill contribution form
    await page.fill('[name="contributorName"]', 'Test Contributor');
    await page.fill('[name="contributorPhone"]', '+258841234567');
    await page.fill('[name="amount"]', '500');
    
    // 3. Submit form
    await page.click('button[type="submit"]');
    
    // 4. Select payment method
    await page.click('[data-payment-method="mpesa"]');
    
    // 5. Confirm payment
    await page.click('button:has-text("Confirm Payment")');
    
    // 6. Verify success message
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

---

## Deployment & Operations

### 1. Environment Configuration

#### 1.1 Production Environment
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    image: umapesa/crowdfunding:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NHONGA_API_KEY=${NHONGA_API_KEY}
      - NHONGA_WEBHOOK_SECRET=${NHONGA_WEBHOOK_SECRET}
      - SMS_API_KEY=${SMS_API_KEY}
      - REDIS_URL=${REDIS_URL}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=umapesa_crowdfunding
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

#### 1.2 Environment Variables
```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/umapesa_crowdfunding
NHONGA_API_KEY=6eyt7lazlppqrrq6j89wp7ah8yhgkmrlgn6v9e4vh9okmtbrnnw90p47c9pi
NHONGA_WEBHOOK_SECRET=iyczwhnhua6qhazoero4qpdxe36nww6sajged43qmgi5mzbh0uy79tjyhu4zb9dhjs7v3mv22hl0mqp8ubw7g2o1d2rqwzn0u76zb48oy5gazyk1kvdjilkr
SMS_API_KEY=your_sms_provider_api_key
REDIS_URL=redis://localhost:6379
WEBHOOK_URL=https://umapesa.com/api/webhooks/nhonga
```

### 2. Monitoring & Logging

#### 2.1 Application Monitoring
```typescript
// Monitoring middleware
const monitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    };
    
    // Log to monitoring service
    monitoringService.logRequest(logData);
    
    // Alert on slow requests
    if (duration > 5000) {
      monitoringService.alertSlowRequest(logData);
    }
  });
  
  next();
};
```

#### 2.2 Error Tracking
```typescript
// Error handling middleware
const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  };
  
  // Log error
  logger.error('Application error', errorData);
  
  // Send to error tracking service
  errorTrackingService.captureError(error, {
    user: req.user,
    request: req,
    extra: errorData
  });
  
  // Return appropriate error response
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
};
```

### 3. Backup & Recovery

#### 3.1 Database Backup Strategy
```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgresql"
DB_NAME="umapesa_crowdfunding"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform database backup
pg_dump -h localhost -U postgres -d $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Upload to cloud storage
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://umapesa-backups/database/

# Clean up old backups (keep last 30 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: backup_$DATE.sql.gz"
```

#### 3.2 Disaster Recovery Plan
```markdown
## Disaster Recovery Procedures

### 1. Database Recovery
1. Stop application services
2. Restore latest database backup
3. Apply any missing transactions from logs
4. Verify data integrity
5. Restart services

### 2. Application Recovery
1. Deploy latest stable version
2. Verify environment configuration
3. Run health checks
4. Monitor error rates
5. Notify stakeholders

### 3. Payment System Recovery
1. Verify Nhonga API connectivity
2. Check pending transactions
3. Reconcile payment statuses
4. Process any stuck withdrawals
5. Notify affected users
```

---

This comprehensive technical specification provides a complete blueprint for implementing the crowdfunding campaign system with all required features, security measures, and operational considerations. The specification ensures scalability, reliability, and compliance with financial regulations while maintaining an excellent user experience.