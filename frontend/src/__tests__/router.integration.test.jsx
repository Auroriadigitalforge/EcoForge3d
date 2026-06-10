// Feature: eco-forge-3d
// Integration tests for App routing behaviour
// TODO: implement with @testing-library/react + MemoryRouter
import { describe, it } from 'vitest';

describe('App router integration', () => {
  it.todo('redirects to /island when localStorage contains a valid score');
  it.todo('shows LandingPage when no score is present in localStorage');
  it.todo('"Start Quiz" button navigates to /quiz without full reload');
});
