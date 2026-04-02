import axios from "axios";

export const axiosInstance = axios.create({
<<<<<<< HEAD
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.MODE === "production" ? "/api" : "http://localhost:5001/api"),
=======
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
>>>>>>> d58fe75cd0322005e75a2f94fc59f4b3b39f23e9
  withCredentials: true,
});
