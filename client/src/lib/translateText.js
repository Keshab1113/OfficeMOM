import axios from "axios";

export async function translateText(targetLang, text) {
  try {
    // If input is an array, translate each element
    if (Array.isArray(text)) {
      const translations = await Promise.all(
        text.map(async (item) => {
          const response = await axios.get("https://api.mymemory.translated.net/get", {
            params: {
              q: item,
              langpair: `en|${targetLang}`,
            },
          });
          return response.data.responseData.translatedText;
        })
      );
      return translations;
    }

    // If input is a single string
    const response = await axios.get("https://api.mymemory.translated.net/get", {
      params: {
        q: text,
        langpair: `en|${targetLang}`,
      },
    });

    return response.data.responseData.translatedText;
  } catch (error) {
    console.error("Translation error:", error);
    return Array.isArray(text) ? text.map(() => "Translation failed") : "Translation failed";
  }
}
