/**
 * Tests for ReadOnlyStepRenderer Component
 */

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ReadOnlyStepRenderer } from '../read-only-step-renderer';
import type { HistoryStep } from '@/lib/workflow-engine/types';

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

      render(<ReadOnlyStepRenderer step={step} stepNumber={1} imageUrl="/test.jpg" />);

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

      render(<ReadOnlyStepRenderer step={step} stepNumber={1} imageUrl="/test.jpg" />);

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

      render(<ReadOnlyStepRenderer step={step} stepNumber={1} imageUrl="/test.jpg" />);

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

      render(<ReadOnlyStepRenderer step={step} stepNumber={1} imageUrl="/test.jpg" />);

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

      render(<ReadOnlyStepRenderer step={step} stepNumber={1} imageUrl="/test.jpg" />);

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

      render(<ReadOnlyStepRenderer step={step} stepNumber={1} imageUrl="/test.jpg" />);

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

      render(<ReadOnlyStepRenderer step={step} stepNumber={1} imageUrl="/test.jpg" />);

      expect(screen.getByText(/Select Classes/i)).toBeInTheDocument();
      expect(screen.getByText(/Option A/i)).toBeInTheDocument();
      expect(screen.getByText(/Option B/i)).toBeInTheDocument();
      expect(screen.getByText(/Option C/i)).toBeInTheDocument();
    });
  });

  describe('Coordinate Parsing', () => {
    it('should detect pixel coordinates', () => {
      const step: HistoryStep = {
        id: 'test-step',
        stateId: 'step1',
        stateName: 'Select Area',
        stateType: 'area_select',
        timestamp: new Date(),
        annotation: {
          id: 'ann-1',
          payload: {
            coordinates: {
              x: 234, // > 100, triggers pixel detection
              y: 567,
              width: 100,
              height: 150,
            },
          },
        },
        contextSnapshot: { metadata: {}, currentState: 'step1', dataSources: {}, data: {} },
      };

      render(<ReadOnlyStepRenderer step={step} stepNumber={1} imageUrl="/test.jpg" />);

      // Check header (using Regex to handle fragmentation)
      expect(screen.getByText(/Step 1: Select Area/i)).toBeInTheDocument();
      
      // Verify coordinate system detection
      expect(screen.getByText(/Coordinate system: pixel \(auto-detected\)/i)).toBeInTheDocument();
    });

    it('should detect normalized coordinates', () => {
      const step: HistoryStep = {
        id: 'test-step',
        stateId: 'step1',
        stateName: 'Select Area',
        stateType: 'area_select',
        timestamp: new Date(),
        annotation: {
          id: 'ann-1',
          payload: {
            coordinates: {
              x: 10, // < 100
              y: 20,
              width: 30,
              height: 40,
            },
          },
        },
        contextSnapshot: { metadata: {}, currentState: 'step1', dataSources: {}, data: {} },
      };

      render(<ReadOnlyStepRenderer step={step} stepNumber={1} imageUrl="/test.jpg" />);

      expect(screen.getByText(/Step 1: Select Area/i)).toBeInTheDocument();
      
      // Verify normalized detection
      expect(screen.getByText(/Coordinate system: normalized \(auto-detected\)/i)).toBeInTheDocument();
    });

    it('should handle nested rectangle format', () => {
      const step: HistoryStep = {
        id: 'test-step',
        stateId: 'step1',
        stateName: 'Select Area',
        stateType: 'area_select',
        timestamp: new Date(),
        annotation: {
          id: 'ann-1',
          payload: {
            coordinates: {
              x: 100,
              y: 200,
              width: 300,
              height: 400,
            },
          },
        },
        contextSnapshot: { metadata: {}, currentState: 'step1', dataSources: {}, data: {} },
      };

      render(<ReadOnlyStepRenderer step={step} stepNumber={1} imageUrl="/test.jpg" />);

      // Verify it still renders correctly with the nested format
      expect(screen.getByText(/Area selected/i)).toBeInTheDocument();
      
      // Check if details/summary exists for coordinate inspection
      expect(screen.getByText(/View coordinates/i)).toBeInTheDocument();
    });

    it('should show error state when no image is provided', () => {
      const step: HistoryStep = {
        id: 'test-step',
        stateId: 'step1',
        stateName: 'Select Area',
        stateType: 'area_select',
        timestamp: new Date(),
        annotation: { id: 'ann-1', payload: { coordinates: { x: 1, y: 1, width: 1, height: 1 } } },
        contextSnapshot: { metadata: {}, currentState: 'step1', dataSources: {}, data: {} },
      };

      // Render without imageUrl
      render(<ReadOnlyStepRenderer step={step} stepNumber={1} />);

      expect(screen.getByText(/No image URL provided/i)).toBeInTheDocument();
    });
  });
});