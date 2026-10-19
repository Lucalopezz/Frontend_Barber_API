import axios from "axios";
export default axios.create({ baseURL: import.meta.env.VITE_API_URL, timeout: 10000, withCredentials: true,
  headers: { 'X-Barber-Session': '1' } });
