import api from '../utils/axiosConfig';

// Incident service functions
const incidentService = {
  // Get all incidents (for admin)
  getAllIncidents: async () => {
    try {
      const response = await api.get('/incidents');
      return response.data;
    } catch (error) {
      console.error('Error fetching incidents:', error);
      throw error;
    }
  },

  // Get incidents for a coach
  getCoachIncidents: async () => {
    try {
      const response = await api.get('/coach/incidents');
      return response.data;
    } catch (error) {
      console.error('Error fetching coach incidents:', error);
      throw error;
    }
  },

  // Get a specific incident
  getIncidentById: async (id) => {
    try {
      const response = await api.get(`/incidents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching incident ${id}:`, error);
      throw error;
    }
  },

  // Create a new incident
  createIncident: async (incidentData) => {
    try {
      const response = await api.post('/coach/incidents', incidentData);
      return response.data;
    } catch (error) {
      console.error('Error creating incident:', error);
      throw error;
    }
  },

  // Update an incident
  updateIncident: async (id, incidentData) => {
    try {
      const response = await api.put(`/coach/incidents/${id}`, incidentData);
      return response.data;
    } catch (error) {
      console.error(`Error updating incident ${id}:`, error);
      throw error;
    }
  },

  // Get incident statistics (for admin)
  getIncidentStats: async () => {
    try {
      const response = await api.get('/admin/incidents/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching incident statistics:', error);
      throw error;
    }
  }
};

export default incidentService; 