import env from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // If the error comes from an Axios request (e.g. to the FastAPI service)
  if (err.response) {
    statusCode = err.response.status || statusCode;
    const responseData = err.response.data;
    message = responseData?.error || responseData?.detail || responseData?.message || err.message || message;
    if (typeof message === 'object') {
      message = JSON.stringify(message);
    }
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: env.nodeEnv === 'production' ? undefined : err.stack
  });
};
