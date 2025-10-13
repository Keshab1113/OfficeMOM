const axios = require('axios');

class ChatController {
  // Send message to DeepSeek API
  async sendMessage(req, res) {
    try {
      const { message, conversationHistory = [] } = req.body;

      // Validate input
      if (!message || message.trim() === '') {
        return res.status(400).json({
          error: 'Message is required',
          success: false
        });
      }

      const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
      
      if (!deepseekApiKey) {
        console.error('DeepSeek API key is not configured');
        return res.status(500).json({
          error: 'Chat service is temporarily unavailable',
          success: false
        });
      }

      // Prepare conversation history for context
      const messages = [
        {
          role: "system",
          content: `You are a helpful support assistant for OfficeMoM, an AI-powered meeting management platform that automatically records, transcribes, and generates minutes of meeting (MoM).

OfficeMoM is a comprehensive web application that helps teams:
• Automatically record meetings with AI-powered transcription
• Generate accurate meeting transcripts in real-time
• Create organized minutes of meeting (MoM) with smart formatting
• Manage complete meeting history and archives
• Share meeting minutes instantly with participants
• Track action items and decisions automatically

TECHNOLOGY STACK:
Frontend: React.js with TailwindCSS
Backend: Node.js with Express.js
Database: MySQL
AI Features: Speech-to-text transcription, smart summarization

KEY FEATURES:
🎯 Automated Meeting Recording - Capture every meeting automatically
📝 AI-Powered Transcription - Convert speech to text with high accuracy
📋 Smart MoM Generation - Automatically format meeting minutes
📁 Meeting History Management - Organize and search past meetings
👥 Participant Management - Easy invite and sharing system
🚀 Action Item Tracking - Identify and assign tasks from discussions
📤 Instant Sharing - Share minutes via email or link
🔍 Search & Analytics - Find insights across all meetings

Provide friendly, helpful, and accurate information about:
1. Setting up and recording meetings
2. Generating and editing transcripts
3. Creating and formatting minutes of meeting
4. Managing meeting history and archives
5. Sharing meeting minutes with teams
6. Troubleshooting recording or transcription issues
7. User account and permission management
8. Integration with calendar and other tools

TROUBLESHOOTING COMMON ISSUES:
• Recording quality and microphone access
• Transcription accuracy improvements
• Meeting minute formatting options
• Sharing and permission settings
• Storage and meeting history management

Keep responses concise but informative (2-3 paragraphs maximum). If you don't know something or encounter a complex technical issue, suggest contacting the support team directly at support@officemom.me.

Always maintain a professional yet friendly tone. Focus on helping users get the most out of OfficeMoM's automated meeting management features.`
        },
        ...conversationHistory.slice(-10), // Keep last 10 messages for context
        {
          role: "user",
          content: message.trim()
        }
      ];

      const response = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
          model: "deepseek-chat",
          messages: messages,
          stream: false,
          max_tokens: 1000,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekApiKey}`
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      if (!response.data.choices || !response.data.choices[0]) {
        throw new Error('Invalid response format from AI service');
      }

      const botResponse = {
        message: response.data.choices[0].message.content,
        usage: response.data.usage,
        timestamp: new Date().toISOString()
      };

      // Log successful request (without sensitive data)
      console.log('Chat request processed successfully:', {
        messageLength: message.length,
        responseLength: botResponse.message.length,
        timestamp: botResponse.timestamp
      });

      res.json({
        success: true,
        data: botResponse
      });

    } catch (error) {
      console.error('Error in sendMessage:', error.response?.data || error.message);

      // Handle different types of errors
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Chat service is temporarily unavailable. Please try again later.',
          success: false
        });
      }

      if (error.response?.status === 401) {
        return res.status(500).json({
          error: 'Authentication error with chat service',
          success: false
        });
      }

      if (error.response?.status === 429) {
        return res.status(429).json({
          error: 'Too many requests. Please wait a moment and try again.',
          success: false
        });
      }

      if (error.response?.status >= 500) {
        return res.status(502).json({
          error: 'Chat service is experiencing issues. Please try again later.',
          success: false
        });
      }

      res.status(500).json({
        error: 'Failed to process your message. Please try again.',
        success: false,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
          sessionId: req.params.sessionId
        }
      });
    } catch (error) {
      console.error('Error getting chat history:', error);
      res.status(500).json({
        error: 'Failed to retrieve chat history',
        success: false
      });
    }
  }

  // Health check for chat service
  async healthCheck(req, res) {
    try {
      const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
      
      if (!deepseekApiKey) {
        return res.status(503).json({
          status: 'unhealthy',
          service: 'deepseek',
          message: 'API key not configured'
        });
      }

      // You could add a test API call here to verify the service is working
      res.json({
        status: 'healthy',
        service: 'deepseek',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        service: 'deepseek',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new ChatController();