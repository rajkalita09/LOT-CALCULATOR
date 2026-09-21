import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import App from '../src/app/App';

describe('partial TP planner app', () => {
  it('renders the planner and updates an exit allocation', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    expect(screen.getByRole('heading', { name: 'PARTIAL TP' })).toBeInTheDocument();
    expect(screen.getByText('Partial Take-Profit & RR Planner')).toBeInTheDocument();
    expect(screen.getAllByText('1 : 1.50').length).toBeGreaterThan(0);

    const allocationInput = screen.getAllByRole('spinbutton')[3];
    await user.clear(allocationInput);
    await user.type(allocationInput, '40');

    expect(screen.getAllByText('40%').length).toBeGreaterThan(0);
  });

  it('keeps fractional lots visible and steps them by 0.001', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    const totalLot = screen.getAllByRole('spinbutton')[0];
    await user.clear(totalLot);
    await user.type(totalLot, '0.05');

    const allocationInput = screen.getAllByRole('spinbutton')[3];
    await user.clear(allocationInput);
    await user.type(allocationInput, '30');

    expect(screen.getAllByDisplayValue('0.02').length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: 'Increase by 0.01' })[0]);
    expect(totalLot).toHaveValue(0.06);
    await user.click(screen.getAllByRole('button', { name: 'Decrease by 0.01' })[0]);
    expect(totalLot).toHaveValue(0.05);
  });

  it('auto-balances a two-exit plan to the full position', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    await user.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getAllByText('70%').length).toBeGreaterThan(0);
    expect(screen.getByText('Fully planned')).toBeInTheDocument();

    const allocationInput = screen.getAllByRole('spinbutton')[3];
    await user.clear(allocationInput);
    await user.type(allocationInput, '60');

    expect(screen.getAllByText('40%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
  });

  it('supports typing a custom exit count beyond four and removing an exit', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    const customCount = screen.getAllByRole('spinbutton')[2];
    await user.clear(customCount);
    await user.type(customCount, '8');

    expect(screen.getByText('8 partial exits')).toBeInTheDocument();
    expect(screen.getAllByText('Exit 08').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /remove exit/i })).toHaveLength(7);

    await user.click(screen.getByRole('button', { name: 'Remove exit 8' }));
    expect(screen.getByText('7 partial exits')).toBeInTheDocument();
    expect(screen.queryByText('Exit 08')).not.toBeInTheDocument();
  });
});
