// import axios from "axios";

// const API_BASE_URL = "https://skillswap-h4b-b9s2.onrender.com/api";

// export const axiosInstance = axios.create({
//   baseURL: API_BASE_URL,
//   withCredentials: true,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "development"
    ? "http://localhost:8000/api"
    : "https://peerconnect-cnqu.onrender.com/api");

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // needed if cookies/sessions are used
  headers: {
    "Content-Type": "application/json",
  },
});
