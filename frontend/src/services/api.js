import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-inject JWT token for authenticated requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-handle 401/403 unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


export const authService = {
  register: async (userData) => {
    const res = await api.post('/register', userData);
    return res.data;
  },
  
  login: async (credentials) => {
    const res = await api.post('/login', credentials);
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  
  adminLogin: async (credentials) => {
    const res = await api.post('/admin/login', credentials);
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getProfile: async () => {
    const res = await api.get('/profile');
    return res.data;
  },
  
  updateProfile: async (profileData) => {
    const res = await api.put('/profile', profileData);
    if (res.data.user) {
      // update stored user data
      const current = JSON.parse(localStorage.getItem('user') || '{}');
      const updated = { ...current, ...res.data.user };
      localStorage.setItem('user', JSON.stringify(updated));
    }
    return res.data;
  },
  
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }
};

export const tripService = {
  planTrip: async (preferences) => {
    const res = await api.post('/plan-trip', preferences);
    return res.data;
  },
  
  generateItinerary: async (params) => {
    const res = await api.post('/generate-itinerary', params);
    return res.data;
  },
  
  estimateCost: async (params) => {
    const res = await api.post('/estimate-cost', params);
    return res.data;
  },
  
  saveTrip: async (tripData) => {
    const res = await api.post('/save-trip', tripData);
    return res.data;
  },
  
  getMyTrips: async () => {
    const res = await api.get('/my-trips');
    return res.data;
  },
  
  deleteTrip: async (tripId) => {
    const res = await api.delete(`/my-trips/${tripId}`);
    return res.data;
  },

  updateTripDate: async (tripId, travel_date) => {
    const res = await api.put(`/my-trips/${tripId}/date`, { travel_date });
    return res.data;
  },

  completeTrip: async (tripId, status = 'completed') => {
    const res = await api.put(`/my-trips/${tripId}/complete`, { status });
    return res.data;
  },
  
  getSingleTrip: async (tripId) => {
    const res = await api.get(`/my-trips/${tripId}`);
    return res.data;
  },

  getNearbyDestinations: async (destId, limit = 6) => {
    const res = await api.get(`/destinations/${destId}/nearby`, { params: { limit } });
    return res.data;
  },

  generateMultiDestinationItinerary: async (payload) => {
    const res = await api.post('/multi-destination-itinerary', payload);
    return res.data;
  },

  estimateMultiDestinationCost: async (payload) => {
    const res = await api.post('/multi-destination-cost', payload);
    return res.data;
  },

  getWeather: async (destId) => {
    const res = await api.get(`/weather/${destId}`);
    return res.data;
  },
  
  getTransport: async (destId, params = {}) => {
    const res = await api.get(`/transportation/${destId}`, { params });
    return res.data;
  },

  // Real location-aware geocoding, route, and recommendation endpoints
  geocode: async (query, limit = 6) => {
    const res = await api.get('/geocode', { params: { q: query, limit } });
    return res.data;
  },

  reverseGeocode: async (lat, lon) => {
    const res = await api.get('/reverse-geocode', { params: { lat, lon } });
    return res.data;
  },

  getRoute: async (origin, destination, profile = 'driving-car') => {
    const res = await api.post('/route', { origin, destination, profile });
    return res.data;
  },

  getTransportOptions: async (payload) => {
    const res = await api.post('/transport-options', payload);
    return res.data;
  },

  getRecommendations: async (payload) => {
    const res = await api.post('/recommendations', payload);
    return res.data;
  },

  getRecommendationsBasedOnPastTrips: async (params = {}) => {
    const res = await api.get('/recommendations/past-trips', { params });
    return res.data;
  },

  getTravelAdvice: async (payload) => {
    const res = await api.post('/ai/travel-advice', payload);
    return res.data;
  },

  getTransportRates: async () => {
    const res = await api.get('/transport-rates');
    return res.data;
  },
  
  getHotels: async (destId) => {
    const res = await api.get(`/hotels/${destId}`);
    return res.data;
  },

  
  // Public lists
  getDestinations: async (params = {}) => {
    const res = await api.get('/destinations', { params });
    return res.data;
  },
  
  getDestinationDetail: async (id) => {
    const res = await api.get(`/destinations/${id}`);
    return res.data;
  },
  
  // Reviews
  getReviews: async (destId) => {
    const res = await api.get(`/reviews/${destId}`);
    return res.data;
  },
  
  postReview: async (reviewData) => {
    const res = await api.post('/reviews', reviewData);
    return res.data;
  },
  
  // Feedback
  postFeedback: async (feedback) => {
    const res = await api.post('/feedback', { feedback });
    return res.data;
  },
  
  // Complaints
  submitComplaint: async (complaintData) => {
    const res = await api.post('/complaints', complaintData);
    return res.data;
  },
  
  getMyComplaints: async () => {
    const res = await api.get('/my-complaints');
    return res.data;
  },

  deleteComplaint: async (complaintId) => {
    const res = await api.delete(`/complaints/${complaintId}`);
    return res.data;
  },
  
  // Diary
  postDiary: async (diaryData) => {
    const res = await api.post('/trip-diary', diaryData);
    return res.data;
  },
  
  getMyDiaries: async () => {
    const res = await api.get('/my-trip-diary');
    return res.data;
  },

  updateDiary: async (id, diaryData) => {
    const res = await api.put(`/trip-diary/${id}`, diaryData);
    return res.data;
  },

  deleteDiary: async (id) => {
    const res = await api.delete(`/trip-diary/${id}`);
    return res.data;
  },

  // Feedback history
  getMyFeedback: async () => {
    const res = await api.get('/my-feedback');
    return res.data;
  }
};

export const chatbotService = {
  sendMessage: async (message) => {
    const res = await api.post('/chatbot', { message });
    return res.data;
  }
};

export const adminService = {
  getAnalytics: async () => {
    const res = await api.get('/admin/analytics');
    return res.data;
  },
  
  // Manage Destinations
  createDestination: async (data) => {
    const res = await api.post('/admin/destinations', data);
    return res.data;
  },
  updateDestination: async (id, data) => {
    const res = await api.put(`/admin/destinations/${id}`, data);
    return res.data;
  },
  deleteDestination: async (id) => {
    const res = await api.delete(`/admin/destinations/${id}`);
    return res.data;
  },
  
  // Manage Hotels
  getHotels: async (destId) => {
    const res = await api.get(`/admin/hotels/${destId}`);
    return res.data;
  },
  createHotel: async (data) => {
    const res = await api.post('/admin/hotels', data);
    return res.data;
  },
  updateHotel: async (id, data) => {
    const res = await api.put(`/admin/hotels/${id}`, data);
    return res.data;
  },
  deleteHotel: async (id) => {
    const res = await api.delete(`/admin/hotels/${id}`);
    return res.data;
  },
  
  // Manage Restaurants
  getRestaurants: async (destId) => {
    const res = await api.get(`/admin/restaurants/${destId}`);
    return res.data;
  },
  createRestaurant: async (data) => {
    const res = await api.post('/admin/restaurants', data);
    return res.data;
  },
  updateRestaurant: async (id, data) => {
    const res = await api.put(`/admin/restaurants/${id}`, data);
    return res.data;
  },
  deleteRestaurant: async (id) => {
    const res = await api.delete(`/admin/restaurants/${id}`);
    return res.data;
  },
  
  // Manage Attractions
  createAttraction: async (data) => {
    const res = await api.post('/admin/attractions', data);
    return res.data;
  },
  updateAttraction: async (id, data) => {
    const res = await api.put(`/admin/attractions/${id}`, data);
    return res.data;
  },
  deleteAttraction: async (id) => {
    const res = await api.delete(`/admin/attractions/${id}`);
    return res.data;
  },
  
  // Manage Transit
  getTransport: async (destId) => {
    const res = await api.get(`/admin/transportation/${destId}`);
    return res.data;
  },
  createTransport: async (data) => {
    const res = await api.post('/admin/transportation', data);
    return res.data;
  },
  updateTransport: async (id, data) => {
    const res = await api.put(`/admin/transportation/${id}`, data);
    return res.data;
  },
  deleteTransport: async (id) => {
    const res = await api.delete(`/admin/transportation/${id}`);
    return res.data;
  },

  // Manage Configurable Transport Rates
  getTransportRates: async () => {
    const res = await api.get('/admin/transport-rates');
    return res.data;
  },
  createTransportRate: async (data) => {
    const res = await api.post('/admin/transport-rates', data);
    return res.data;
  },
  updateTransportRate: async (id, data) => {
    const res = await api.put(`/admin/transport-rates/${id}`, data);
    return res.data;
  },

  
  // User Management
  getUsers: async () => {
    const res = await api.get('/admin/users');
    return res.data;
  },
  createUser: async (data) => {
    const res = await api.post('/admin/users', data);
    return res.data;
  },
  updateUser: async (id, data) => {
    const res = await api.put(`/admin/users/${id}`, data);
    return res.data;
  },
  deleteUser: async (id) => {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },
  getTrips: async () => {
    const res = await api.get('/admin/trips');
    return res.data;
  },
  deleteTrip: async (id) => {
    const res = await api.delete(`/admin/trips/${id}`);
    return res.data;
  },
  getFeedback: async () => {
    const res = await api.get('/admin/feedback');
    return res.data;
  },
  deleteFeedback: async (id) => {
    const res = await api.delete(`/admin/feedback/${id}`);
    return res.data;
  },
  getChatLogs: async () => {
    const res = await api.get('/admin/chatbot-logs');
    return res.data;
  },
  
  // Complaints management
  getComplaints: async () => {
    const res = await api.get('/admin/complaints');
    return res.data;
  },
  replyComplaint: async (id, replyData) => {
    const res = await api.put(`/admin/complaints/${id}`, replyData);
    return res.data;
  },
  deleteComplaint: async (id) => {
    const res = await api.delete(`/admin/complaints/${id}`);
    return res.data;
  },
  
  // Reviews management
  getReviews: async () => {
    const res = await api.get('/admin/reviews');
    return res.data;
  },
  deleteReview: async (id) => {
    const res = await api.delete(`/admin/reviews/${id}`);
    return res.data;
  },

  // Weather Cache management
  getWeatherCache: async () => {
    const res = await api.get('/admin/weather');
    return res.data;
  },
  createWeatherCache: async (data) => {
    const res = await api.post('/admin/weather', data);
    return res.data;
  },
  updateWeatherCache: async (id, data) => {
    const res = await api.put(`/admin/weather/${id}`, data);
    return res.data;
  },
  deleteWeatherCache: async (id) => {
    const res = await api.delete(`/admin/weather/${id}`);
    return res.data;
  },

  // Diary Management
  getDiaries: async () => {
    const res = await api.get('/admin/diaries');
    return res.data;
  },

  deleteDiary: async (id) => {
    const res = await api.delete(`/admin/diaries/${id}`);
    return res.data;
  }
};

export default api;
