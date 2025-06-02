import axios from "axios";
import Cookies from "js-cookie"; // Import js-cookie for handling cookies

const axiosClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`
});

// Add a request interceptor to include the JWT token from cookies
axiosClient.interceptors.request.use((config) => {
  const token = Cookies.get('ACCESS_TOKEN'); // Retrieve the token from cookies
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add a response interceptor to handle errors globally
axiosClient.interceptors.response.use((response) => {
  return response;
}, (error) => {
  const { response } = error;

  if (response) {
    if (response.status === 401) {
      // Unauthorized: Clear the token and redirect to login
      Cookies.remove('ACCESS_TOKEN');
      Cookies.remove('userEmail'); // Remove the email cookie
      // window.location.href = '/'; // Uncomment this line to redirect
    } else if (response.status === 404) {
      console.error("Resource not found");
    }
  }

  return Promise.reject(error);
});

export default axiosClient;