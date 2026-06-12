import { spawn } from "child_process";

export const predictHabit = async (req, res) => {
  const { streak, completion } = req.body;

  const python = spawn("python", ["python/predict.py", streak, completion]);

  let output = "";

  python.stdout.on("data", (data) => {
    output += data.toString();
  });

  python.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  python.on("close", () => {
    res.json({
      prediction: output.trim(),
    });
  });
};
