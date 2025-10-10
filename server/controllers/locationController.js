const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const getUserLocation = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (lat && lon) {
      // Use Nominatim reverse geocoding to get country/city
      const nominatimUrl = `${process.env.OPENSTREET_URL}?format=json&lat=${lat}&lon=${lon}`;

      const geoRes = await axios.get(nominatimUrl, {
        headers: { "User-Agent": "Node.js App" },
      });

      const address = geoRes.data.address || {};
      return res.status(200).json({
        success: true,
        data: {
          latitude: lat,
          longitude: lon,
          city: address.city || address.town || address.village || null,
          state: address.state || null,
          country: address.country || null,
        },
        method: "browser",
      });
    }

    // Otherwise, use user's IP
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    if (ip?.includes(",")) ip = ip.split(",")[0];
    if (ip?.startsWith("::ffff:")) ip = ip.split("::ffff:")[1];

    const url = `${process.env.IPINFO_URL}/${ip}/json`;
    const response = await axios.get(url);
    const data = response.data;

    res.status(200).json({
      success: true,
      data: {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country,
        loc: data.loc,
      },
      method: "ip",
    });
  } catch (error) {
    console.error("Error fetching location:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch location",
      error: error.message,
    });
  }
};

module.exports = { getUserLocation };
