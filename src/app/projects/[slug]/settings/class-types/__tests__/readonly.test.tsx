import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { NextIntlClientProvider } from 'next-intl';
import { ClassTypesClient } from '../class-types-client';

vi.mock('@/app/_components/ui/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

// Les vraies traductions, pour ne pas dépendre d'un jeu de clés réécrit à la main.
import enMessages from '@/messages/en.json';

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [{ id: 'c1', name: 'Dentrite Plate', status: 'ACTIVE',
                         createdAt: '2026-09-01T00:00:00.000Z', _count: { annotationTypes: 3 } }],
  }) as any;
});

const show = (readOnly: boolean) => render(
  <NextIntlClientProvider locale="en" messages={enMessages as any}>
    <ClassTypesClient slug="p" readOnly={readOnly} />
  </NextIntlClientProvider>
);

describe('ClassTypesClient readOnly', () => {
  it('grise tous les contrôles mutants pour un USER', async () => {
    show(true);
    await waitFor(() => expect(screen.getByText('Dentrite Plate')).toBeInTheDocument());
    const buttons = screen.getAllByRole('button');
    const mutating = buttons.filter(b => /Add/.test(b.textContent || '') || b.querySelector('svg'));
    expect(mutating.length).toBeGreaterThanOrEqual(3);
    for (const b of mutating) expect(b).toBeDisabled();
    // le badge de statut ne doit plus être présenté comme cliquable
    expect(screen.getByText('Active').className).not.toContain('cursor-pointer');
  });

  it('laisse les contrôles actifs pour un ADMIN', async () => {
    show(false);
    await waitFor(() => expect(screen.getByText('Dentrite Plate')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Add/ })).toBeEnabled();
    expect(screen.getByText('Active').className).toContain('cursor-pointer');
  });
});
