const axios = require("axios");

class ChatController {
  // Send message to DeepSeek API
  async sendMessage(req, res) {
    try {
      const { message, conversationHistory = [] } = req.body;

      // Validate input
      if (!message || message.trim() === "") {
        return res.status(400).json({
          error: "Message is required",
          success: false,
        });
      }

      const deepseekApiKey = process.env.DEEPSEEK_API_KEY;

      if (!deepseekApiKey) {
        console.error("DeepSeek API key is not configured");
        return res.status(500).json({
          error: "Chat service is temporarily unavailable",
          success: false,
        });
      }

      // Prepare conversation history for context
      const messages = [
        {
          role: "system",
          content: `You are a friendly and knowledgeable customer support assistant for **OfficeMoM**, an AI-powered meeting management and transcription platform.

💡 **ABOUT OFFICEMOM**
OfficeMoM helps individuals and teams automatically record, transcribe, and generate smart minutes of meeting (MoM) using AI. It saves time, improves accuracy, and helps users stay organized with shareable summaries and action items.

🧠 **CORE FEATURES**
• Automated meeting recording & transcription  
• AI-generated minutes of meeting with smart formatting  
• Secure meeting history & sharing  
• Action item tracking  
• Team management & permissions  
• Multi-language transcription (English, Hindi, Spanish, French, etc.)  
• Integrations: Google Meet, Zoom, Microsoft Teams, Slack  
• Fully mobile-optimized & browser-compatible  

💳 **PRICING OVERVIEW**
Be warm and helpful when explaining pricing — summarize clearly with both **monthly** and **yearly** options.  
Here’s the structure you can follow:

---
**Free Plan — $0/month or $0/year**  
Perfect for individuals getting started.  
• 100 total minutes (lifetime)  
• Max 30 minutes per meeting/file  
• Basic transcription + email support  

**Professional — $9/month or $97/year (Save $11 per year)**  
Great for professionals & power users.  
• 900 mins/month  
• Priority transcription + AI insights  
• Email support  

**Professional Plus — $19/month or $205/year (Save $23 per year)**  
Best for small teams or frequent users.  
• 2000 mins/month  
• Advanced export options + priority support  

**Business — $37/month or $400/year (Save $44 per year)**  
Ideal for growing teams.  
• 4500 mins/month  
• Team management, security controls, custom integrations  

**Business Plus — $55/month or $594/year (Save $66 per year)**  
For enterprise users.  
• 7000 mins/month  
• Dedicated account manager, advanced security  

---

💵 **REFUNDS & BILLING**
• 7-day money-back guarantee on all paid plans  
• Cancel, upgrade, or downgrade anytime from Billing settings  
• Accepted payments: Credit/Debit Cards, PayPal, Razorpay  

🔒 **SECURITY**
Enterprise-grade encryption (SSL, SOC 2) + GDPR-compliant servers.  
Your transcripts are private and can be deleted anytime.

📞 **SUPPORT**
Email: support@officemom.me  
Live Chat: Available 24/7 in the app  

Website Link: https://officemom.me
Company Link: https://quantumhash.me
Parent Company name: QuantumHash Corporation

🎯 **YOUR ROLE**
As the support assistant:
• Respond in a friendly, conversational tone (avoid sounding robotic).  
• Use simple, direct sentences — like talking to a real user.  
• When explaining pricing, show the **plan name**, **monthly & yearly rates**, and **key benefits**.  
• Keep answers short (2–3 short paragraphs or a clean bullet list).  
• End with a warm offer to help, e.g., “Would you like me to recommend a plan based on your usage?”  
• If unsure, direct users to contact support@officemom.me.  

Always make users feel welcome, informed, and confident using OfficeMoM.`,
        },
        ...conversationHistory.slice(-10),
        {
          role: "user",
          content: message.trim(),
        },
      ];

      const response = await axios.post(
        process.env.DEEPSEEK_API_URL,
        {
          model: "deepseek-chat",
          messages: messages,
          stream: false,
          max_tokens: 1000,
          temperature: 0.7,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${deepseekApiKey}`,
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      if (!response.data.choices || !response.data.choices[0]) {
        throw new Error("Invalid response format from AI service");
      }

      const botResponse = {
        message: response.data.choices[0].message.content,
        usage: response.data.usage,
        timestamp: new Date().toISOString(),
      };

      // Log successful request (without sensitive data)
      console.log("Chat request processed successfully:", {
        messageLength: message.length,
        responseLength: botResponse.message.length,
        timestamp: botResponse.timestamp,
      });

      res.json({
        success: true,
        data: botResponse,
      });
    } catch (error) {
      console.error(
        "Error in sendMessage:",
        error.response?.data || error.message
      );

      // Handle different types of errors
      if (error.code === "ECONNREFUSED") {
        return res.status(503).json({
          error:
            "Chat service is temporarily unavailable. Please try again later.",
          success: false,
        });
      }

      if (error.response?.status === 401) {
        return res.status(500).json({
          error: "Authentication error with chat service",
          success: false,
        });
      }

      if (error.response?.status === 429) {
        return res.status(429).json({
          error: "Too many requests. Please wait a moment and try again.",
          success: false,
        });
      }

      if (error.response?.status >= 500) {
        return res.status(502).json({
          error: "Chat service is experiencing issues. Please try again later.",
          success: false,
        });
      }

      res.status(500).json({
        error: "Failed to process your message. Please try again.",
        success: false,
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Get chat history (optional - for persistence)
  async getChatHistory(req, res) {
    try {
      // In a real application, you'd fetch this from a database
      // For now, return empty or mock data
      res.json({
        success: true,
        data: {
          messages: [],
          sessionId: req.params.sessionId,
        },
      });
    } catch (error) {
      console.error("Error getting chat history:", error);
      res.status(500).json({
        error: "Failed to retrieve chat history",
        success: false,
      });
    }
  }

  // Health check for chat service
  async healthCheck(req, res) {
    try {
      const deepseekApiKey = process.env.DEEPSEEK_API_KEY;

      if (!deepseekApiKey) {
        return res.status(503).json({
          status: "unhealthy",
          service: "deepseek",
          message: "API key not configured",
        });
      }

      // You could add a test API call here to verify the service is working
      res.json({
        status: "healthy",
        service: "deepseek",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        service: "deepseek",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = new ChatController();
