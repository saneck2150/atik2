import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export async function fetchThumbnail(blob, size = 256) {
  const fd = new FormData();
  fd.append("file", blob, "file");
  fd.append("size", size);

  const res = await fetch("http://localhost:8004/thumbnail", {
    method: "POST",
    body: fd,
  });

  return await res.blob(); // PNG preview
}