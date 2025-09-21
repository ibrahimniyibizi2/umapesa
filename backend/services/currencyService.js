import fetch from 'node-fetch';

// Static exchange rates (replace with real API if needed)
const EXCHANGE_RATES = {
  'MZN_TO_RWF': 18.5,
  'RWF_TO_MZN': 0.054,
  'MZN_TO_USD': 0.016,
  'USD_TO_RWF': 1250
};

export async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Normalize currency codes
    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();

    let rate;
    const rateKey = `${fromCurrency}_TO_${toCurrency}`;
    
    if (EXCHANGE_RATES[rateKey]) {
      rate = EXCHANGE_RATES[rateKey];
    } else {
      // Try inverse rate
      const inverseKey = `${toCurrency}_TO_${fromCurrency}`;
      if (EXCHANGE_RATES[inverseKey]) {
        rate = 1 / EXCHANGE_RATES[inverseKey];
      } else {
        // Default rate for MZN to RWF
        if (fromCurrency === 'MZN' && toCurrency === 'RWF') {
          rate = 18.5;
        } else if (fromCurrency === 'RWF' && toCurrency === 'MZN') {
          rate = 0.054;
        } else {
          console.warn(`Exchange rate not found for ${fromCurrency} to ${toCurrency}, using 1:1`);
          rate = 1;
        }
      }
    }

    const convertedAmount = amount * rate;
    const roundedAmount = Math.round(convertedAmount * 100) / 100;
    
    console.log(`Currency conversion: ${amount} ${fromCurrency} = ${roundedAmount} ${toCurrency} (rate: ${rate})`);
    
    return roundedAmount;
  } catch (error) {
    console.error('Currency conversion error:', error);
    throw new Error(`Failed to convert ${fromCurrency} to ${toCurrency}: ${error.message}`);
  }
}

export async function getExchangeRate(fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return 1;
  
  fromCurrency = fromCurrency.toUpperCase();
  toCurrency = toCurrency.toUpperCase();
  
  const rateKey = `${fromCurrency}_TO_${toCurrency}`;
  
  if (EXCHANGE_RATES[rateKey]) {
    return EXCHANGE_RATES[rateKey];
  }
  
  const inverseKey = `${toCurrency}_TO_${fromCurrency}`;
  if (EXCHANGE_RATES[inverseKey]) {
    return 1 / EXCHANGE_RATES[inverseKey];
  }
  
  // Default rates
  if (fromCurrency === 'MZN' && toCurrency === 'RWF') {
    return 18.5;
  } else if (fromCurrency === 'RWF' && toCurrency === 'MZN') {
    return 0.054;
  }
  
  return 1;
}

// Function to update exchange rates from external API
export async function fetchLatestRates() {
  try {
    // You can replace this with a real exchange rate API
    // For example: https://api.exchangerate-api.com/v4/latest/MZN
    
    console.log('Using static exchange rates. Implement real API if needed.');
    return EXCHANGE_RATES;
  } catch (error) {
    console.error('Failed to fetch latest exchange rates:', error);
    return EXCHANGE_RATES; // Fallback to static rates
  }
}

// Update exchange rates periodically
export function updateExchangeRates(newRates) {
  Object.assign(EXCHANGE_RATES, newRates);
  console.log('Exchange rates updated:', EXCHANGE_RATES);
}