import axios from 'axios';
import env from './env.js';

const pythonAiClient = axios.create({
  baseURL: env.pythonAiServiceUrl,
  timeout: 60000, // 60 seconds timeout as AI/LLM operations can be slow
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor for logging requests and errors
pythonAiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorDetails = {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    };
    console.error('FastAPI Call Error:', errorDetails);
    return Promise.reject(error);
  }
);

export default pythonAiClient;
