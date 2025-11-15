const axios = require("axios");
const dotenv = require("dotenv");
const { countryToCurrency } = require("../config/countryToCurrency");

dotenv.config();


// 🧭 Get currency and locale by country
const getCurrencyAndLocaleByCountry = (countryName = '') => {
  if (!countryName) return { currency: 'USD', locale: 'en-US' };
  const normalized = countryName.trim();
  return countryToCurrency[normalized] || { currency: 'USD', locale: 'en-US' };
};

// 💰 Format price for any currency and locale
const formatPriceForCurrency = (price, currency, locale = 'en-US') => {
  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);

    return {
      amount: price,
      formatted,
      currency,
      locale
    };
  } catch (error) {
    // Fallback to USD formatting
    console.warn(`Failed to format ${price} ${currency} for locale ${locale}, falling back to USD`);
    return {
      amount: price,
      formatted: `$${price}`,
      currency: 'USD',
      locale: 'en-US',
      fallback: true
    };
  }
};

// 💰 Exchange rate cache
let exchangeCache = { rates: null, timestamp: null };
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

const getExchangeRates = async () => {
  const now = Date.now();

  // Use cache if valid
  if (exchangeCache.rates && (now - exchangeCache.timestamp) < CACHE_DURATION) {
    return exchangeCache.rates;
  }

  try {
    const response = await axios.get('https://open.er-api.com/v6/latest/USD');
    const rates = response.data?.rates || {};
    exchangeCache = { rates, timestamp: now };
    return rates;
  } catch (err) {
    console.error("⚠️ Error fetching live exchange rates:", err.message);
    // fallback
    const fallback = { USD: 1, INR: 83.25, EUR: 0.92, GBP: 0.79 };
    exchangeCache = { rates: fallback, timestamp: now };
    return fallback;
  }
};

// 🌐 Main location handler
const getUserLocation = async (req, res) => {
  try {
    const { lat, lon, includeRates = 'false' } = req.query;
    const shouldIncludeRates = includeRates === 'true';
    let locationData = {};
    let method = "ip";
    

    if (lat && lon) {
      // Google reverse geocode
      const googleUrl = `${process.env.OPENSTREET_URL}?latlng=${lat},${lon}&key=${process.env.GOOGLE_API_KEY}`;
      const geoRes = await axios.get(googleUrl);
      const components = geoRes.data.results[0]?.address_components || [];

      const getComponent = (type) =>
        components.find((c) => c.types.includes(type))?.long_name || null;

      const country = getComponent("country");
      const { currency, locale } = getCurrencyAndLocaleByCountry(country);

      locationData = {
        latitude: lat,
        longitude: lon,
        city: getComponent("locality"),
        state: getComponent("administrative_area_level_1"),
        country,
        currency,
        locale
      };
      method = "browser";
    } else {
      // IP fallback
      const ipRes = await axios.get("https://ipapi.co/json/");
      const { currency, locale } = getCurrencyAndLocaleByCountry(ipRes.data.country_name);

      locationData = {
        latitude: ipRes.data.latitude,
        longitude: ipRes.data.longitude,
        city: ipRes.data.city,
        state: ipRes.data.region,
        country: ipRes.data.country_name,
        currency,
        locale
      };
    }

    const rates = shouldIncludeRates ? await getExchangeRates() : null;
    const conversionRate = rates ? rates[locationData.currency] || 1 : null;

    const responseData = {
      success: true,
      method,
      data: {
        ...locationData,
        conversionRateFromUSD: conversionRate,
      },
      ...(shouldIncludeRates && { exchangeRates: rates }),
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("❌ Error fetching user location:", error.message);
    return res.status(200).json({
      success: true,
      method: "fallback",
      data: {
        country: "United States",
        currency: "USD",
        locale: "en-US",
        conversionRateFromUSD: 1,
      },
    });
  }
};

// 🆕 New endpoint to format prices
const formatPrices = async (req, res) => {
  try {
    const { prices, currency, locale } = req.body;

    if (!prices || !Array.isArray(prices)) {
      return res.status(400).json({
        success: false,
        message: "Prices array is required"
      });
    }

    const formattedPrices = prices.map(price =>
      formatPriceForCurrency(price, currency || 'USD', locale || 'en-US')
    );

    return res.status(200).json({
      success: true,
      data: formattedPrices
    });
  } catch (error) {
    console.error("❌ Error formatting prices:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to format prices"
    });
  }
};

module.exports = {
  getUserLocation,
  getCurrencyAndLocaleByCountry,
  formatPriceForCurrency,
  formatPrices
};