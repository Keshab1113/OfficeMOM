const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();
const getUserLocation = async (req, res) => {
  try {
    const { lat, lon } = req.query;
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
          raw: geoRes.data, // optional, helps debugging
        });
      }

      const result = geoRes.data.results[0];
      const components = result.address_components || [];

      const getComponent = (type) =>
        components.find((c) => c.types.includes(type))?.long_name || null;

      return res.status(200).json({
        success: true,
        data: {
          latitude: lat,
          longitude: lon,
          city: getComponent("locality"),
          state: getComponent("administrative_area_level_1"),
          country: getComponent("country"),
        },
        method: "browser",
      });
    }
  } catch (error) {
    console.error(
      "Error fetching location:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch location",
      error: error.response?.data || error.message,
    });
  }
};

module.exports = { getUserLocation };
