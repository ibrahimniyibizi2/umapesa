import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

export async function payoutToFlutterwave({amount, currency, beneficiary}) {
  const url = `${process.env.FLW_BASE_URL}/v3/transfers`;
  
  const body = {
    account_bank: beneficiary.bank_code || "MPS", // Mobile Money Rwanda
    account_number: beneficiary.account_number,
    amount,
    currency,
    narration: `Payout tx ${beneficiary.orig_tx}`,
    reference: `nhg-${beneficiary.orig_tx}`,
    callback_url: `${process.env.CALLBACK_BASE_URL || 'http://localhost:3000'}/webhook/flutterwave`,
    debit_currency: currency
  };

  console.log('Flutterwave transfer request:', {
    ...body,
    account_number: maskPhoneNumber(body.account_number)
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`
      },
      body: JSON.stringify(body)
    });

    const json = await res.json();
    
    console.log('Flutterwave response:', {
      status: res.status,
      success: json.status === 'success',
      message: json.message
    });

    return { status: res.status, body: json };
  } catch (error) {
    console.error('Flutterwave API error:', error);
    throw new Error(`Flutterwave transfer failed: ${error.message}`);
  }
}

export async function getFlutterwaveBalance() {
  const url = `${process.env.FLW_BASE_URL}/v3/balances`;
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`
      }
    });

    const json = await res.json();
    return { status: res.status, body: json };
  } catch (error) {
    console.error('Flutterwave balance check error:', error);
    throw error;
  }
}

export async function verifyFlutterwaveAccount(phoneNumber) {
  const url = `${process.env.FLW_BASE_URL}/v3/misc/verify_payment`;
  
  const formattedPhone = formatRwandanPhone(phoneNumber);
  const body = {
    account_number: formattedPhone,
    account_bank: "MPS"
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`
      },
      body: JSON.stringify(body)
    });

    const json = await res.json();
    return { status: res.status, body: json };
  } catch (error) {
    console.error('Flutterwave verification error:', error);
    return { status: 500, body: { error: error.message } };
  }
}

export function formatRwandanPhone(phone) {
  if (!phone) return null;
  
  let cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.startsWith('250')) {
    return cleanPhone;
  } else if (cleanPhone.startsWith('0')) {
    return '250' + cleanPhone.substring(1);
  } else if (cleanPhone.length === 8 || cleanPhone.length === 9) {
    return '250' + cleanPhone;
  }
  
  return null;
}

function maskPhoneNumber(phone) {
  if (!phone || phone.length < 8) return phone;
  return phone.substring(0, 4) + '****' + phone.substring(phone.length - 2);
}