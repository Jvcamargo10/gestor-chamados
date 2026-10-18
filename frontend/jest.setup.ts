import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';

// O react-router usa TextEncoder, que o jsdom não expõe.
Object.assign(globalThis, { TextEncoder, TextDecoder });
