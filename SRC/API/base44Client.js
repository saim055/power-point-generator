let API_BASE_URL = 'http://localhost:3001/api';
if (typeof window !== 'undefined' && window.location && window.location.origin) {
  API_BASE_URL = `${window.location.origin}/api`;
}
if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
  API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
}

class Base44API {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Auth methods
  async me() {
    return this.request('/auth/me', { method: 'POST' });
  }

  async logout(redirectUrl) {
    // Simple logout - just clear session
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }

  async redirectToLogin(returnUrl) {
    // For local version, just return to home
    window.location.href = returnUrl || '/';
  }

  // File upload
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseURL}/integrations/core/upload-file`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    return response.json();
  }

  // Data extraction
  async extractData(fileUrl, jsonSchema) {
    return this.request('/integrations/core/extract-data', {
      method: 'POST',
      body: {
        file_url: fileUrl,
        json_schema: jsonSchema
      }
    });
  }

  // Presentations
  async createPresentation(data) {
    return this.request('/entities/lesson-presentation', {
      method: 'POST',
      body: data
    });
  }

  async getPresentations() {
    return this.request('/presentations');
  }

  async getPresentation(id) {
    return this.request(`/presentations/${id}`);
  }

  async updatePresentation(id, data) {
    return this.request(`/presentations/${id}`, {
      method: 'PUT',
      body: data
    });
  }

  async deletePresentation(id) {
    return this.request(`/presentations/${id}`, {
      method: 'DELETE'
    });
  }
}

// Create singleton instance
const base44 = new Base44API();

// Organize by modules like original Base44
base44.auth = {
  me: () => base44.me(),
  logout: (redirectUrl) => base44.logout(redirectUrl),
  redirectToLogin: (returnUrl) => base44.redirectToLogin(returnUrl)
};

base44.integrations = {
  Core: {
    UploadFile: ({ file }) => base44.uploadFile(file),
    ExtractDataFromUploadedFile: ({ file_url, json_schema }) => base44.extractData(file_url, json_schema)
  }
};

base44.entities = {
  LessonPresentation: {
    create: (data) => base44.createPresentation(data),
    list: () => base44.getPresentations(),
    get: (id) => base44.getPresentation(id),
    update: (id, data) => base44.updatePresentation(id, data),
    delete: (id) => base44.deletePresentation(id)
  }
};

export { base44 };
export default base44;
