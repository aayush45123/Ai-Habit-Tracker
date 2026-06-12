import { spawn } from "child_process";

export const predictHabit = async (req, res) => {
  try {
    const { streak, completion } = req.body;

    const python = spawn("python", [
      "./python/predict.py",
      streak.toString(),
      completion.toString(),
    ]);

    let result = "";
    let error = "";

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      error += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0) {
        return res.status(500).json({
          message: "Prediction failed",
          error,
        });
      }

      const prediction = result.trim();

      res.json({
        prediction: prediction === "1" ? "LIKELY_SUCCESS" : "LIKELY_FAILURE",
      });
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
