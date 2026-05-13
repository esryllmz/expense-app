import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Hatanın detayını terminale değil, bizzat konsola "bağırarak" yazdır
        console.error("🚨 API ERROR DETAYI:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        return Promise.reject(error);
    }
);

export default api;