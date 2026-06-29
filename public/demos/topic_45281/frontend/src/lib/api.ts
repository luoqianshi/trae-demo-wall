const API_BASE_URL = '/api';

const resource = (name: string) => ({
  base: `${API_BASE_URL}/${name}`,
  item: (id: number | string) => `${API_BASE_URL}/${name}/${id}`,
});

export const API_ENDPOINTS = {
  drugs: resource('drugs'),
  patients: resource('patients'),
  doctors: resource('doctors'),
  registrations: resource('registrations'),
  prescriptions: resource('prescriptions'),
  medicalRecords: resource('medical-records'),
};

export default API_BASE_URL;
