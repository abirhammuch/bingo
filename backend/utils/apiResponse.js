export const successResponse = (res, data = {}, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

export const errorResponse = (res, message = "An error occurred", statusCode = 500, error = null) => {
  const payload = {
    success: false,
    message,
  };
  if (error) payload.error = error;
  return res.status(statusCode).json(payload);
};

export const notFoundResponse = (res, message = "Resource not found") =>
  errorResponse(res, message, 404);

export const validationErrorResponse = (res, errors = [], message = "Validation failed") =>
  errorResponse(res, message, 400, { errors });
