import axios from "axios";

export default axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    Authorization: localStorage.getItem("token")
      ? `Bearer ${localStorage.getItem("token")}`
      : "",
  },
});
