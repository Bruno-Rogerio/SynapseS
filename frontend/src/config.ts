// src/config.ts

interface Config {
    API_BASE_URL: string;
  }
  
  const config: Config = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string || 'http://localhost:5000',
  };
  
  export default config;
  