import axios from "axios";

const devApiBaseUrl = `${window.location.protocol}//${window.location.hostname}:3000/api`;

export const axiosInstance = axios.create({
    baseURL:
        import.meta.env.MODE === "development"
            ? devApiBaseUrl
            : "https://smartlib-csu-backend.vercel.app/api",
    withCredentials: true,  
})


