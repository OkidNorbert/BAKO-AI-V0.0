// Security Settings
export const getSecuritySettings = () => {
  return axios.get('/api/admin/security/settings');
};

export const updateSecuritySettings = (settings) => {
  return axios.put('/api/admin/security/settings', settings);
};

export const getSecurityLogs = (params) => {
  return axios.get('/api/admin/security/logs', { params });
}; 