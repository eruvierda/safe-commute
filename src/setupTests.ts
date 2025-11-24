import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock alert for tests
Object.defineProperty(globalThis, 'alert', {
  value: vi.fn(),
  writable: true,
});