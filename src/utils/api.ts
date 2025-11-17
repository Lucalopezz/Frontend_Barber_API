import axios from "axios";
axios.defaults.timeout = 10000;

export default axios.create({
  baseURL:  import.meta.env.VITE_API_URL,
});
