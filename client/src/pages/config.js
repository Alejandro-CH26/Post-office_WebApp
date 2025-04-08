const isDevelopment = process.env.NODE_ENV === 'development';
const API_BASE_URL = isDevelopment 
  ? process.env.REACT_APP_API_URL 
  : process.env.REACT_APP_API_PRODUCTION;

export { API_BASE_URL };