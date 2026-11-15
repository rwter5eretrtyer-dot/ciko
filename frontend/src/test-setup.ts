import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// После каждого теста удаляем компоненты со страницы.
// Это не позволяет предыдущим тестам влиять на следующие.
afterEach(() => {
  cleanup();
});
