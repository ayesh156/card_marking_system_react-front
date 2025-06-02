import axios from "axios";
import Cookies from "js-cookie"; // Import js-cookie for handling cookies

const axiosClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`
});

// Add a request interceptor to include the JWT token in the Authorization header
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ACCESS_TOKEN'); // Retrieve the token from localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Add the token to the Authorization header
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add a response interceptor to handle errors globally
axiosClient.interceptors.response.use((response) => {
  return response; // Return the response if successful
}, (error) => {
  const { response } = error;

  if (response) {
    if (response.status === 401) {
      // Unauthorized: Clear the token and redirect to login
      localStorage.removeItem('ACCESS_TOKEN');
      Cookies.remove('userEmail'); // Remove the email cookie
      // window.location.href = '/'; // Redirect to the login page
    } else if (response.status === 404) {
      // Handle 404 errors (e.g., show a "Not Found" message)
      console.error("Resource not found");
    }
  }

  return Promise.reject(error); // Reject the error to handle it in individual requests
});

export default axiosClient;