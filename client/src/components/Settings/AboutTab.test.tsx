import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../../../tests/helpers/render';
import { resetAllStores } from '../../../tests/helpers/store';
import AboutTab from './AboutTab';

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
});

describe('AboutTab', () => {
  it('FE-COMP-ABOUT-001: renders without crashing', () => {
    render(<AboutTab appVersion="2.9.10" />);
    expect(document.body).toBeInTheDocument();
  });

  it('FE-COMP-ABOUT-002: displays the version badge', () => {
    render(<AboutTab appVersion="2.9.10" />);
    expect(screen.getByText('v2.9.10')).toBeInTheDocument();
  });

  it('FE-COMP-ABOUT-003: version badge reflects the passed version', () => {
    render(<AboutTab appVersion="1.0.0" />);
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  // De-branded: the About tab no longer links to the upstream author's
  // donation pages (Ko-fi / Buy Me a Coffee) or the mauriceboe/TREK repo.
  it('FE-COMP-ABOUT-004: shows no upstream donation or mauriceboe/TREK links', () => {
    render(<AboutTab appVersion="2.9.10" />);
    expect(screen.queryByText('Buy Me a Coffee')).toBeNull();
    expect(screen.queryByText('Ko-fi')).toBeNull();
    expect(document.querySelector('a[href*="mauriceboe"]')).toBeNull();
    expect(document.querySelector('a[href*="buymeacoffee"]')).toBeNull();
    expect(document.querySelector('a[href*="ko-fi"]')).toBeNull();
  });
});
