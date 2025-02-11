import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { t } from '@vegaprotocol/i18n';
import { useEnvironment } from '../../hooks/use-environment';
import {
  NetworkSwitcher,
  envNameMapping,
  envTriggerMapping,
  envDescriptionMapping,
} from './';
import { Networks } from '../../';

jest.mock('../../hooks/use-environment');

describe('Network switcher', () => {
  const { location } = window;
  let hrefSetSpy: jest.SpyInstance;

  beforeEach(() => {
    hrefSetSpy = jest.fn();
    // @ts-ignore can't set location as optional
    delete window.location;
    window.location = {} as Location;
    Object.defineProperty(window.location, 'href', {
      // @ts-ignore set cannot take SpyInstance
      set: hrefSetSpy,
    });
  });

  afterEach(() => {
    window.location = location;
  });

  it.each`
    network             | label
    ${Networks.CUSTOM}  | ${envTriggerMapping[Networks.CUSTOM]}
    ${Networks.DEVNET}  | ${envTriggerMapping[Networks.DEVNET]}
    ${Networks.TESTNET} | ${envTriggerMapping[Networks.TESTNET]}
    ${Networks.MAINNET} | ${envTriggerMapping[Networks.MAINNET]}
  `(
    'displays the correct selection label for $network',
    ({ network, label }) => {
      // @ts-ignore Typescript doesn't know about this module being mocked
      useEnvironment.mockImplementation(() => ({
        VEGA_ENV: network,
        VEGA_NETWORKS: {},
      }));

      render(<NetworkSwitcher />);

      expect(screen.getByRole('button')).toHaveTextContent(label);
    }
  );

  it('displays mainnet and testnet on the default dropdown view', async () => {
    const mainnetUrl = 'https://main.net';
    const testnetUrl = 'https://test.net';
    // @ts-ignore Typescript doesn't know about this module being mocked
    useEnvironment.mockImplementation(() => ({
      VEGA_ENV: Networks.DEVNET,
      VEGA_NETWORKS: {
        [Networks.MAINNET]: mainnetUrl,
        [Networks.TESTNET]: testnetUrl,
      },
    }));

    render(<NetworkSwitcher />);

    await userEvent.click(screen.getByRole('button'));
    let links = screen.getAllByRole('link');

    expect(links[0]).toHaveTextContent(envNameMapping[Networks.MAINNET]);
    expect(links[1]).toHaveTextContent(envNameMapping[Networks.TESTNET]);
    expect(links[0]).not.toHaveTextContent(t('current'));
    expect(links[1]).not.toHaveTextContent(t('current'));
    expect(links[0]).not.toHaveTextContent(t('not available'));
    expect(links[1]).not.toHaveTextContent(t('not available'));
    expect(links[2]).toHaveTextContent(t('Propose a network parameter change'));

    const menuitems = screen.getAllByRole('menuitem');

    expect(menuitems[0]).toHaveTextContent('Advanced');

    await userEvent.click(links[0]);
    expect(hrefSetSpy).toHaveBeenCalledWith(mainnetUrl);

    // re open dropdown as clicking an item will close it
    await userEvent.click(screen.getByRole('button'));
    links = screen.getAllByRole('link');

    await userEvent.click(links[1]);
    expect(hrefSetSpy).toHaveBeenCalledWith(testnetUrl);
  });

  it('displays the correct selected network on the default dropdown view', async () => {
    const mainnetUrl = 'https://main.net';
    const testnetUrl = 'https://test.net';
    // @ts-ignore Typescript doesn't know about this module being mocked
    useEnvironment.mockImplementation(() => ({
      VEGA_ENV: Networks.MAINNET,
      VEGA_NETWORKS: {
        [Networks.MAINNET]: mainnetUrl,
        [Networks.TESTNET]: testnetUrl,
      },
    }));

    render(<NetworkSwitcher />);

    await userEvent.click(screen.getByRole('button'));

    const links = screen.getAllByRole('link');

    expect(links[0]).toHaveTextContent(envNameMapping[Networks.MAINNET]);
    expect(links[0]).toHaveTextContent(t('current'));
  });

  it('displays the correct selected network on the default dropdown view when it does not have an associated url', async () => {
    const testnetUrl = 'https://test.net';
    // @ts-ignore Typescript doesn't know about this module being mocked
    useEnvironment.mockImplementation(() => ({
      VEGA_ENV: Networks.MAINNET,
      VEGA_NETWORKS: {
        [Networks.MAINNET]: undefined,
        [Networks.TESTNET]: testnetUrl,
      },
    }));

    render(<NetworkSwitcher />);

    await userEvent.click(screen.getByRole('button'));

    const links = screen.getAllByRole('link');

    expect(links[0]).toHaveTextContent(envNameMapping[Networks.MAINNET]);
    expect(links[0]).toHaveTextContent(t('current'));
  });

  it('displays the correct state for a network without url on the default dropdown view', async () => {
    const testnetUrl = 'https://test.net';
    // @ts-ignore Typescript doesn't know about this module being mocked
    useEnvironment.mockImplementation(() => ({
      VEGA_ENV: Networks.TESTNET,
      VEGA_NETWORKS: {
        [Networks.MAINNET]: undefined,
        [Networks.TESTNET]: testnetUrl,
      },
    }));

    render(<NetworkSwitcher />);

    await userEvent.click(screen.getByRole('button'));
    const links = screen.getAllByRole('link');

    expect(links[0]).toHaveTextContent(envNameMapping[Networks.MAINNET]);
    expect(links[0]).toHaveTextContent(t('not available'));
  });

  it.each([Networks.MAINNET, Networks.TESTNET, Networks.DEVNET])(
    'displays the advanced view in the correct state',
    async (network) => {
      const VEGA_NETWORKS: Record<Networks, string | undefined> = {
        [Networks.CUSTOM]: undefined,
        [Networks.MAINNET]: 'https://main.net',
        [Networks.TESTNET]: 'https://test.net',
        [Networks.VALIDATOR_TESTNET]: 'https://validator-test.net',
        [Networks.DEVNET]: 'https://dev.net',
        [Networks.STAGNET1]: 'https://stag1.net',
      };
      // @ts-ignore Typescript doesn't know about this module being mocked
      useEnvironment.mockImplementation(() => ({
        VEGA_ENV: Networks.DEVNET,
        VEGA_NETWORKS,
      }));

      render(<NetworkSwitcher />);

      await userEvent.click(screen.getByTestId('network-switcher'));

      expect(
        await screen.findByRole('menuitem', { name: t('Advanced') })
      ).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('menuitem', { name: t('Advanced') })
      );

      expect(
        await screen.findByText(envDescriptionMapping[network])
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', {
          name: new RegExp(`^${envNameMapping[network]}`),
        })
      ).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('link', {
          name: new RegExp(`^${envNameMapping[network]}`),
        })
      );

      expect(hrefSetSpy).toHaveBeenCalledWith(VEGA_NETWORKS[network]);
    }
  );

  it('labels the selected network in the advanced view', async () => {
    const selectedNetwork = Networks.DEVNET;
    const VEGA_NETWORKS: Record<Networks, string | undefined> = {
      [Networks.CUSTOM]: undefined,
      [Networks.MAINNET]: 'https://main.net',
      [Networks.VALIDATOR_TESTNET]: 'https://validator-test.net',
      [Networks.TESTNET]: 'https://test.net',
      [Networks.DEVNET]: 'https://dev.net',
      [Networks.STAGNET1]: 'https://stag1.net',
    };
    // @ts-ignore Typescript doesn't know about this module being mocked
    useEnvironment.mockImplementation(() => ({
      VEGA_ENV: selectedNetwork,
      VEGA_NETWORKS,
    }));

    render(<NetworkSwitcher />);

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(
      screen.getByRole('menuitem', { name: t('Advanced') })
    );

    const label = screen.getByText(`(${t('current')})`);

    expect(label).toBeInTheDocument();
    expect(label.parentNode?.parentNode?.firstElementChild).toHaveTextContent(
      envNameMapping[selectedNetwork]
    );
  });

  it('labels unavailable networks view in the correct state', async () => {
    const selectedNetwork = Networks.DEVNET;
    const VEGA_NETWORKS: Record<Networks, string | undefined> = {
      [Networks.CUSTOM]: undefined,
      [Networks.MAINNET]: undefined,
      [Networks.VALIDATOR_TESTNET]: 'https://validator-test.net',
      [Networks.TESTNET]: 'https://test.net',
      [Networks.DEVNET]: 'https://dev.net',
      [Networks.STAGNET1]: 'https://stag1.net',
    };
    // @ts-ignore Typescript doesn't know about this module being mocked
    useEnvironment.mockImplementation(() => ({
      VEGA_ENV: selectedNetwork,
      VEGA_NETWORKS,
    }));

    render(<NetworkSwitcher />);

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByText('Advanced'));

    const label = screen.getByText('(not available)');

    expect(label).toBeInTheDocument();
    expect(label.parentNode?.parentNode?.firstElementChild).toHaveTextContent(
      envNameMapping[Networks.MAINNET]
    );
  });
});
