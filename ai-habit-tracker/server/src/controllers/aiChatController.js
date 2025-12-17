import OpenAI from "openai";
import AIChat from "../models/aiChat.js";

function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

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

    // Check if OpenAI is configured
    const openai = createOpenAIClient();
    if (!openai) {
      return res.status(500).json({
        message: "OPENAI_API_KEY not set. Add it to enable AI chat.",
      });
    }

    // Save user message
    await AIChat.create({
      userId,
      role: "user",
      message,
    });

    // Get last 10 messages for context
    const history = await AIChat.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const messages = history
      .reverse()
      .map((m) => ({ role: m.role, content: m.message }));

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a habit coach. Give concise, actionable, motivating answers.",
        },
        ...messages,
      ],
      temperature: 0.4,
    });

    const reply = completion.choices[0].message.content;

    // Save AI reply
    const aiMsg = await AIChat.create({
      userId,
      role: "assistant",
      message: reply,
    });

    res.json({ reply: aiMsg });
  } catch (err) {
    console.error("AI chat error:", err);
    res.status(500).json({ message: "AI chat error", error: err.message });
  }
};
