import AIChat from "../models/aiChat.js";
import CalorieProfile from "../models/CalorieProfile.js";
import { completeWithGroq } from "../utils/aiClient.js";

/* ---------------------------
   GET CHAT HISTORY
---------------------------- */
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const history = await AIChat.find({ userId })
      .sort({ createdAt: 1 })
      .limit(50);

    res.json({ history });
  } catch (err) {
    console.error("Chat history error:", err);
    res.status(500).json({ message: "Failed to fetch chat history" });
  }
};

/* ---------------------------
   SEND MESSAGE
---------------------------- */
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message required" });
    }

    // Save user message
    await AIChat.create({
      userId,
      role: "user",
      message,
    });

    // Fetch profile context
    const profile = await CalorieProfile.findOne({ userId });
    let profileContext = "";
    if (profile) {
      profileContext = `\nUser Profile context:\n- Age: ${profile.age}\n- Height: ${profile.height} cm\n- Weight: ${profile.weight} kg\n- Gender: ${profile.gender}\n- Activity Level: ${profile.activityLevel}\n- Fitness Goal: ${profile.goal}\nTailor your coaching advice to align with these details when appropriate.`;
    }

    // Get last 10 messages for context
    const history = await AIChat.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const messages = history
      .reverse()
      .map((m) => ({ role: m.role, content: m.message }));

    let reply = "";
    try {
      const { content } = await completeWithGroq({
        messages: [
          {
            role: "system",
            content:
              "You are an encouraging and practical habit coach. Give concise, actionable, motivating answers." +
              profileContext,
          },
          ...messages,
        ],
        temperature: 0.4,
        max_tokens: 600,
      });
      reply = content;
    } catch (groqErr) {
      console.warn("Groq chat error, using fallback coach response:", groqErr.message);
      reply =
        "I'm currently operating in offline mode, but remember: consistency beats intensity every single time. Keep taking small daily steps towards your goals!";
    }

    // Save AI reply
    const aiMsg = await AIChat.create({
      userId,
      role: "assistant",
      message: reply,
    });

    res.json({ reply: aiMsg });
  } catch (err) {
    console.error("AI CHAT ERROR:", err);
    res.status(500).json({
      message: "AI chat error",
      error: err.message,
    });
  }
};
