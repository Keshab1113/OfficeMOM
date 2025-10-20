const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

// Currency mapping for common countries
const countryToCurrency = {
  'United States': 'USD',
  'India': 'INR',
  'United Kingdom': 'GBP',
  'Canada': 'CAD',
  'Australia': 'AUD',
  'Germany': 'EUR',
  'France': 'EUR',
  'Italy': 'EUR',
  'Spain': 'EUR',
  'Japan': 'JPY',
  'China': 'CNY',
  'Brazil': 'BRL',
  'Mexico': 'MXN',
  'South Korea': 'KRW',
  'Russia': 'RUB',
  'Singapore': 'SGD',
  'United Arab Emirates': 'AED',
  'Saudi Arabia': 'SAR',
  'South Africa': 'ZAR',
  'New Zealand': 'NZD',
  'Switzerland': 'CHF',
  'Netherlands': 'EUR',
  'Sweden': 'SEK',
  'Norway': 'NOK',
  'Denmark': 'DKK',
  'Poland': 'PLN',
  'Turkey': 'TRY',
  'Indonesia': 'IDR',
  'Malaysia': 'MYR',
  'Thailand': 'THB',
  'Vietnam': 'VND',
  'Philippines': 'PHP',
  'Pakistan': 'PKR',
  'Bangladesh': 'BDT',
  'Sri Lanka': 'LKR',
  'Nigeria': 'NGN',
  'Egypt': 'EGP',
  'Kenya': 'KES',
  'Israel': 'ILS'
};

// Cache for exchange rates
let exchangeCache = {
  rates: null,
  timestamp: null
};

const CACHE_DURATION = 3600000; // 1 hour in milliseconds

const getExchangeRates = async () => {
  const now = Date.now();
  
  // Return cached rates if they're still valid
  if (exchangeCache.rates && (now - exchangeCache.timestamp) < CACHE_DURATION) {
    return exchangeCache.rates;
  }

  try {
    // Using exchangerate-api.com (free tier)
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    exchangeCache = {
      rates: response.data.rates,
      timestamp: now
    };
    return response.data.rates;
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error.message);
    
    // Fallback rates (you can update these periodically)
    const fallbackRates = {
      'USD': 1,
      'INR': 83.25,
      'EUR': 0.92,
      'GBP': 0.79,
      'CAD': 1.36,
      'AUD': 1.52,
      'JPY': 148.50,
      'CNY': 7.18
    };
    
    exchangeCache = {
      rates: fallbackRates,
      timestamp: now
    };
    return fallbackRates;
  }
};

const getUserLocation = async (req, res) => {
  try {
    const { lat, lon, includeRates = 'false' } = req.query;
    const shouldIncludeRates = includeRates === 'true';
    
    if (lat && lon) {
      const googleUrl = `${process.env.OPENSTREET_URL}?latlng=${lat},${lon}&key=${process.env.GOOGLE_API_KEY}`;

      const geoRes = await axios.get(googleUrl);

      if (
        !geoRes.data ||
        !geoRes.data.results ||
        geoRes.data.results.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "No location data found for the given coordinates",
          raw: geoRes.data,
        });
      }

      const result = geoRes.data.results[0];
      const components = result.address_components || [];

      const getComponent = (type) =>
        components.find((c) => c.types.includes(type))?.long_name || null;

      const country = getComponent("country");
      const currency = countryToCurrency[country] || 'USD';

      const responseData = {
        success: true,
        data: {
          latitude: lat,
          longitude: lon,
          city: getComponent("locality"),
          state: getComponent("administrative_area_level_1"),
          country: country,
          currency: currency
        },
        method: "browser",
      };

      // Include exchange rates if requested
      if (shouldIncludeRates) {
        const rates = await getExchangeRates();
        responseData.exchangeRates = rates;
      }

      return res.status(200).json(responseData);
    } else {
      // Fallback: Get location by IP
      try {
        const ipResponse = await axios.get('https://ipapi.co/json/');
        const ipData = ipResponse.data;
        
        const currency = countryToCurrency[ipData.country_name] || ipData.currency || 'USD';

        const responseData = {
          success: true,
          data: {
            latitude: ipData.latitude,
            longitude: ipData.longitude,
            city: ipData.city,
            state: ipData.region,
            country: ipData.country_name,
            currency: currency
          },
          method: "ip",
        };

        // Include exchange rates if requested
        if (shouldIncludeRates) {
          const rates = await getExchangeRates();
          responseData.exchangeRates = rates;
        }

        return res.status(200).json(responseData);
      } catch (ipError) {
        console.error("IP-based location failed:", ipError.message);
        
        const responseData = {
          success: true,
          data: {
            country: "United States",
            currency: "USD"
          },
          method: "fallback",
        };

        if (shouldIncludeRates) {
          const rates = await getExchangeRates();
          responseData.exchangeRates = rates;
        }

        return res.status(200).json(responseData);
      }
    }
  } catch (error) {
    console.error(
      "Error fetching location:",
      error.response?.data || error.message
    );
    
    const responseData = {
      success: true,
      data: {
        country: "United States",
        currency: "USD"
      },
      method: "error_fallback",
    };

    if (req.query.includeRates === 'true') {
      const rates = await getExchangeRates();
      responseData.exchangeRates = rates;
    }

    return res.status(200).json(responseData);
  }
};

module.exports = { getUserLocation };