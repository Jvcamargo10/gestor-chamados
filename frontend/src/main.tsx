import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ApiDemo } from './api/api-demo';
import { ApiHttp } from './api/api-http';
import { App } from './App';
import './index.css';

const demo = import.meta.env.VITE_DEMO === 'true';
const api = demo ? new ApiDemo() : new ApiHttp(import.meta.env.VITE_API_URL ?? '');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App api={api} demo={demo} urlStorybook={`${import.meta.env.BASE_URL}storybook/`} />
  </StrictMode>,
);
