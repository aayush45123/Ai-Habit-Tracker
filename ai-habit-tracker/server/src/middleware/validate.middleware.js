/**
 * Zod Validation Middleware
 * Validates incoming request data against a specified Zod schema.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} target - Request object property to validate (default: 'body')
 */
export const validate = (schema, target = "body") => {
  return (req, res, next) => {
    try {
      const parsedData = schema.parse(req[target]);
      req[target] = parsedData; // Assign validated & sanitized data back
      next();
    } catch (error) {
      const issues = error.issues || error.errors;
      if (issues && Array.isArray(issues)) {
        const formattedErrors = issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        return res.status(400).json({
          message: "Validation failed",
          errors: formattedErrors,
        });
      }
      return res.status(400).json({
        message: "Invalid request data",
        error: error.message || error,
      });
    }
  };
};

export default validate;
