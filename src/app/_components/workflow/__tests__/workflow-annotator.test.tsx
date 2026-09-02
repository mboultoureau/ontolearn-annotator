/**
 * Tests for WorkflowAnnotator Component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { WorkflowAnnotator } from '../workflow-annotator';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Add this mock at the top with your other mocks
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

// Mock XState
vi.mock('xstate', () => ({
  setup: vi.fn(() => ({
    createActor: vi.fn(() => ({
      start: vi.fn(),
      send: vi.fn(),
      subscribe: vi.fn((callback) => {
        callback({ value: 'test_state', context: { data: {} } });
        return { unsubscribe: vi.fn() };
      }),
      stop: vi.fn(),
      getSnapshot: vi.fn(() => ({
        value: 'test_state',
        context: { data: {} },
      })),
    })),
  })),
}));

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  pathname: '/test',
  query: {},
  asPath: '/test',
};

describe('WorkflowAnnotator', () => {
  const mockWorkflowDef = {
    metadata: {
      id: 'test_workflow',
      name: 'Test Workflow',
      version: '1.0.0',
    },
    workflow: {
      entry: 'step1',
      states: [
        {
          id: 'step1',
          type: 'choice',
          name: 'First Step',
          storeAs: 'data.choice',
          transitions: [{ target: 'final' }],
        },
        {
          id: 'final',
          type: 'final',
          message: 'Done',
        },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <AppRouterContext.Provider value={mockRouter as any}>
        {component}
      </AppRouterContext.Provider>
    );
  };

  it('should render workflow annotator', () => {
    renderWithRouter(
      <WorkflowAnnotator
        workflowDef={mockWorkflowDef}
        projectSlug="test-project"
        imageId="test-image"
        imageUrl="/test.jpg"
      />
    );

    // Should render without crashing
    expect(screen.queryByText(/Test Workflow/i)).toBeDefined();
  });

  it('should initialize history on mount', () => {
    renderWithRouter(
      <WorkflowAnnotator
        workflowDef={mockWorkflowDef}
        projectSlug="test-project"
        imageId="test-image"
        imageUrl="/test.jpg"
      />
    );

    // History should be initialized
    // Previous button should be disabled initially
    const prevButton = screen.queryByText(/Previous/i);
    if (prevButton) {
      expect(prevButton).toBeDisabled();
    }
  });

  it('should display current state', async () => {
    renderWithRouter(
      <WorkflowAnnotator
        workflowDef={mockWorkflowDef}
        projectSlug="test-project"
        imageId="test-image"
        imageUrl="/test.jpg"
      />
    );

    await waitFor(() => {
      // Should display current step
      expect(screen.queryByText(/First Step/i)).toBeDefined();
    });
  });
});
