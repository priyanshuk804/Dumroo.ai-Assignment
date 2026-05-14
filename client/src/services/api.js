import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to upload PDF');
  }
};

export const askQuestion = async (question) => {
  try {
    const response = await axios.post(`${API_URL}/ask`, { question });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to get answer');
  }
};
