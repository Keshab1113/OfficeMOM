const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const getUserLocation = async (req, res) => {
  try {
    const url = process.env.IPINFO_URL;

    // Debug log (remove later)
    console.log("Using IPINFO_URL:", url);

    if (!url) {
      throw new Error("IPINFO_URL is not defined in environment variables");
    }

    const response = await axios.get(url);
    const data = response.data;

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching user location:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch location data",
      error: error.message,
    });
  }
};

module.exports = { getUserLocation };
