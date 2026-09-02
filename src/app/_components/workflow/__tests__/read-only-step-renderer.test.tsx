/**
 * Tests for ReadOnlyStepRenderer Component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { NextIntlClientProvider } from 'next-intl';
import { ReadOnlyStepRenderer } from '../read-only-step-renderer';
import type { HistoryStep } from '@/lib/workflow-engine/types';

// Mock the image overlay component to simplify tests
vi.mock('@/app/_components/common/image-with-area-overlay', () => ({
  ImageWithAreaOverlay: ({ imageUrl, title }: any) => (
    <div data-testid="image-overlay">{title || 'Image'}</div>
  ),
}));

const mockMessages = {
  Workflow: {
    history: {
      stepLabelWithName: 'Step {number}: {name}',
      yes: 'Yes',
      no: 'No',
      selectedOptions: 'Selected options',
    },
  },
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('ReadOnlyStepRenderer', () => {
  describe('ReadOnlyChoice', () => {
    it('should render choice step', () => {
      const step: HistoryStep = {
        id: 'test-step',
        stateId: 'step1',
        stateName: 'Choose Option',
        stateType: 'choice',
        timestamp: new Date(),
        annotation: {
          id: 'ann-1',
          payload: 'Option A',
        },
        contextSnapshot: {
          metadata: {},
          currentState: 'step1',
          dataSources: {},
          data: {},
        },
      };

      renderWithIntl(<ReadOnlyStepRenderer step={step} stepNumber={1} imageUrl="/test.jpg" />);

      expect(screen.getByText(/Choose Option/i)).toBeInTheDocument();
      expect(screen.getByText(/Option A/i)).toBeInTheDocument();
    });

    it('should handle missing payload gracefully', () => {
      const step: HistoryStep = {
        id: 'test-step',
        stateId: 'step1',
        stateName: 'Choose Option',
        stateType: 'choice',
        timestamp: new Date(),
        annotation: {
          id: 'ann-1',
          payload: {},
        },
        contextSnapshot: {
          metadata: {},
          currentState: 'step1',
          dataSources: {},
          data: {},
        },
      };

      renderWithIntl(<ReadOnlyStepRenderer step={step} stepNumber={1} imageUrl="/test.jpg" />);

      expect(screen.getByText(/Choose Option/i)).toBeInTheDocument();
    });
  });

  describe('ReadOnlyYesNo', () => {
    it('should render yes answer', () => {
      const step: HistoryStep = {
        id: 'test-step',
        stateId: 'step1',
        stateName: 'Continue?',
        stateType: 'yes_no',
        timestamp: new Date(),
        annotation: {
          id: 'ann-1',
          payload: { answer: true },
        },
        contextSnapshot: {
          metadata: {},
          currentState: 'step1',
          dataSources: {},
          data: {},
        },
      };

      renderWithIntl(<ReadOnlyStepRenderer step={step} stepNumber={1} imageUrl="/test.jpg" />);

      expect(screen.getByText(/Continue\?/i)).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('should render no answer', () => {
      const step: HistoryStep = {
        id: 'test-step',
        stateId: 'step1',
        stateName: 'Continue?',
        stateType: 'yes_no',
        timestamp: new Date(),
        annotation: {
          id: 'ann-1',
          payload: { answer: false },
        },
        contextSnapshot: {
          metadata: {},
          currentState: 'step1',
          dataSources: {},
          data: {},
        },
      };

      renderWithIntl(<ReadOnlyStepRenderer step={step} stepNumber={1} imageUrl="/test.jpg" />);

      expect(screen.getByText(/Continue\?/i)).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });

  describe('ReadOnlyMultiChoice', () => {
    it('should render multiple selected options', () => {
      const step: HistoryStep = {
        id: 'test-step',
        stateId: 'step1',
        stateName: 'Select Classes',
        stateType: 'multi_choice',
        timestamp: new Date(),
        annotation: {
          id: 'ann-1',
          payload: {
            subsection: {
              classes: [
                { value: 'Class A', rank: 1 },
                { value: 'Class B', rank: 2 },
              ],
            },
          },
        },
        contextSnapshot: {
          metadata: {},
          currentState: 'step1',
          dataSources: {},
          data: {},
        },
      };

      renderWithIntl(<ReadOnlyStepRenderer step={step} stepNumber={1} imageUrl="/test.jpg" />);

      expect(screen.getByText(/Select Classes/i)).toBeInTheDocument();
      expect(screen.getByText(/Class A/i)).toBeInTheDocument();
      expect(screen.getByText(/Class B/i)).toBeInTheDocument();
    });

    it('should handle simple string array payload', () => {
      const step: HistoryStep = {
        id: 'test-step',
        stateId: 'step1',
        stateName: 'Select Classes',
        stateType: 'multi_choice',
        timestamp: new Date(),
        annotation: {
          id: 'ann-1',
          payload: ['Option 1', 'Option 2'],
        },
        contextSnapshot: {
          metadata: {},
          currentState: 'step1',
          dataSources: {},
          data: {},
        },
      };

      renderWithIntl(<ReadOnlyStepRenderer step={step} stepNumber={1} imageUrl="/test.jpg" />);

      expect(screen.getByText(/Select Classes/i)).toBeInTheDocument();
      expect(screen.getByText(/Option 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Option 2/i)).toBeInTheDocument();
    });

    it('should handle nested payload structures', () => {
      const step: HistoryStep = {
        id: 'test-step',
        stateId: 'step1',
        stateName: 'Select Classes',
        stateType: 'multi_choice',
        timestamp: new Date(),
        annotation: {
          id: 'ann-1',
          payload: {
            deep: {
              nested: {
                classes: ['Option A', 'Option B', 'Option C'],
              },
            },
          },
        },
        contextSnapshot: {
          metadata: {},
          currentState: 'step1',
          dataSources: {},
          data: {},
        },
      };

      renderWithIntl(<ReadOnlyStepRenderer step={step} stepNumber={1} imageUrl="/test.jpg" />);

      expect(screen.getByText(/Select Classes/i)).toBeInTheDocument();
      expect(screen.getByText(/Option A/i)).toBeInTheDocument();
      expect(screen.getByText(/Option B/i)).toBeInTheDocument();
      expect(screen.getByText(/Option C/i)).toBeInTheDocument();
    });
  });
});