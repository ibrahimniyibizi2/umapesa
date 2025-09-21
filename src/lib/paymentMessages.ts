export interface PaymentConfirmationData {
  amount: number;
  currency: string;
  transactionId: string;
  paymentMethod: 'card' | 'mpesa' | 'emola';
  cardType?: string;
  cardLastFour?: string;
  recipientName?: string;
  campaignTitle?: string;
}

export class PaymentMessageService {
  /**
   * Generate confirmation SMS message based on payment method
   */
  static generateConfirmationMessage(data: PaymentConfirmationData): string {
    const { amount, currency, transactionId, paymentMethod } = data;
    
    switch (paymentMethod) {
      case 'mpesa':
        return `Payment confirmed. M-Pesa mobile payment: ${amount.toLocaleString()} ${currency}. Transaction ID: ${transactionId}. Thank you! - UmaPesa`;
      
      case 'emola':
        return `Payment confirmed. eMola mobile payment: ${amount.toLocaleString()} ${currency}. Transaction ID: ${transactionId}. Thank you! - UmaPesa`;
      
      case 'card':
        const cardInfo = data.cardType && data.cardLastFour 
          ? `${data.cardType} ending in ${data.cardLastFour}`
          : 'Card payment';
        return `Payment confirmed. ${cardInfo}. Amount: ${amount.toLocaleString()} ${currency}. Transaction ID: ${transactionId}. Thank you! - UmaPesa`;
      
      default:
        return `Payment confirmed. Amount: ${amount.toLocaleString()} ${currency}. Transaction ID: ${transactionId}. Thank you! - UmaPesa`;
    }
  }

  /**
   * Generate money transfer confirmation message
   */
  static generateTransferConfirmation(data: PaymentConfirmationData): string {
    const { amount, currency, transactionId, recipientName } = data;
    
    return `Money transfer confirmed. ${amount.toLocaleString()} ${currency} sent to ${recipientName}. Reference: ${transactionId}. - UmaPesa`;
  }

  /**
   * Generate campaign contribution confirmation message
   */
  static generateContributionConfirmation(data: PaymentConfirmationData): string {
    const { amount, currency, transactionId, campaignTitle } = data;
    
    return `Contribution confirmed. ${amount.toLocaleString()} ${currency} contributed to "${campaignTitle}". Transaction ID: ${transactionId}. Thank you for your support! - UmaPesa`;
  }

  /**
   * Generate recipient notification message
   */
  static generateRecipientNotification(data: {
    amount: number;
    currency: string;
    senderName: string;
    transactionId: string;
  }): string {
    const { amount, currency, senderName, transactionId } = data;
    
    return `You have received ${amount.toLocaleString()} ${currency} from ${senderName}. Reference: ${transactionId}. - UmaPesa`;
  }

  /**
   * Generate withdrawal confirmation message
   */
  static generateWithdrawalConfirmation(data: {
    amount: number;
    currency: string;
    method: 'mpesa' | 'emola';
    transactionId: string;
    campaignTitle?: string;
  }): string {
    const { amount, currency, method, transactionId, campaignTitle } = data;
    const methodName = method === 'mpesa' ? 'M-Pesa' : 'eMola';
    const source = campaignTitle ? ` from campaign "${campaignTitle}"` : '';
    
    return `Withdrawal confirmed. ${amount.toLocaleString()} ${currency} sent to your ${methodName} account${source}. Reference: ${transactionId}. - UmaPesa`;
  }

  /**
   * Generate payment failure notification
   */
  static generateFailureNotification(data: {
    amount: number;
    currency: string;
    transactionId: string;
    reason?: string;
  }): string {
    const { amount, currency, transactionId, reason } = data;
    const reasonText = reason ? ` Reason: ${reason}.` : '';
    
    return `Payment failed. ${amount.toLocaleString()} ${currency} transaction ${transactionId} could not be processed.${reasonText} Please try again. - UmaPesa`;
  }
}

// Example usage and test messages
export const exampleMessages = {
  mobilePayment: PaymentMessageService.generateConfirmationMessage({
    amount: 25.00,
    currency: 'USD',
    transactionId: 'TXN123456',
    paymentMethod: 'mpesa'
  }),
  
  cardPayment: PaymentMessageService.generateConfirmationMessage({
    amount: 50.00,
    currency: 'USD',
    transactionId: 'TXN789012',
    paymentMethod: 'card',
    cardType: 'Visa',
    cardLastFour: '1234'
  }),
  
  campaignContribution: PaymentMessageService.generateContributionConfirmation({
    amount: 100.00,
    currency: 'MZN',
    transactionId: 'TXN456789',
    paymentMethod: 'mpesa',
    campaignTitle: 'Emergency Medical Treatment for Maria'
  }),
  
  moneyTransfer: PaymentMessageService.generateTransferConfirmation({
    amount: 1000.00,
    currency: 'MZN',
    transactionId: 'UMP20240125001',
    paymentMethod: 'card',
    recipientName: 'Maria Gonzalez'
  })
};