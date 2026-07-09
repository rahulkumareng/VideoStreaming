import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

export const initiateUpload = (payload) =>
  api.post("/uploads/initiate", payload);

export const completeUpload = (payload) =>
  api.post("/uploads/complete", payload);
