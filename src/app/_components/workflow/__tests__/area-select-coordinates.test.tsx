import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { NextIntlClientProvider } from 'next-intl';
import { ReadOnlyStepRenderer } from '../read-only-step-renderer';

vi.mock('@/app/_components/common/image-with-area-overlay', () => ({
  ImageWithAreaOverlay: ({ coordinates }: any) => (
    <div data-testid="overlay">points:{coordinates?.length}</div>
  ),
}));

const messages = { Workflow: { history: { stepLabelWithName: 'Step {number}: {name}', yes: 'Yes', no: 'No', selectedOptions: 'Selected options' } } };

const step = (payload: any): any => ({
  id: 's', stateId: 'detail_zone', stateName: 'Detail zone', stateType: 'area_select',
  timestamp: new Date(),
  annotation: { id: 'a', payload },
  contextSnapshot: { metadata: {}, currentState: 'detail_zone', dataSources: {}, data: {} },
});

const show = (payload: any) => render(
  <NextIntlClientProvider locale="en" messages={messages}>
    <ReadOnlyStepRenderer step={step(payload)} stepNumber={1} imageUrl="/u/x.gif" />
  </NextIntlClientProvider>
);

describe('ReadOnlyAreaSelect coordinates', () => {
  it('rectangle {x,y,width,height}', () => {
    show({ coordinates: { x: 587, y: 131, width: 255, height: 369 } });
    expect(screen.queryByText('Invalid coordinates')).toBeNull();
    expect(screen.getByTestId('overlay')).toHaveTextContent('points:4');
  });

  it('polygone en tuples [x,y] — la forme reellement stockee en base', () => {
    show({ coordinates: [[378.2,247.7],[566.6,401.7],[569.0,405.7],[722.1,270.2],[371.0,155.5]] });
    expect(screen.queryByText('Invalid coordinates')).toBeNull();
    expect(screen.getByTestId('overlay')).toHaveTextContent('points:5');
  });

  it('polygone en objets {x,y}', () => {
    show({ coordinates: [{x:1,y:2},{x:3,y:4},{x:5,y:6}] });
    expect(screen.queryByText('Invalid coordinates')).toBeNull();
    expect(screen.getByTestId('overlay')).toHaveTextContent('points:3');
  });

  it('reste en erreur si les points sont vraiment invalides', () => {
    show({ coordinates: [[1],[2]] });
    expect(screen.getByText('Invalid coordinates')).toBeInTheDocument();
  });
});
