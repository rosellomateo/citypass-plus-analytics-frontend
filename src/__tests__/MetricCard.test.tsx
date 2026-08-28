// src/__tests__/MetricCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MetricCard } from '../components/common/MetricCard/MetricCard';

describe('MetricCard', () => {
  it('renders label and formatted value correctly', () => {
    render(
      <MetricCard
        metric={{
          label: 'Total Reclamos',
          value: 1250,
          unit: ' reclamos',
          status: 'info',
        }}
      />
    );

    expect(screen.getByText('Total Reclamos')).toBeInTheDocument();
    expect(screen.getByText('1.250')).toBeInTheDocument();
    expect(screen.getByText('reclamos')).toBeInTheDocument();
  });
});
