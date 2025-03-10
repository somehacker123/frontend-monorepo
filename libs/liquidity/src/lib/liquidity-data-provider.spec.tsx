import type { LiquidityProviderFeeShare } from '@vegaprotocol/types';
import { AccountType } from '@vegaprotocol/types';
import { getLiquidityProvision } from './liquidity-data-provider';
import type { LiquidityProvisionFieldsFragment } from './__generated__/MarketLiquidity';

const input = {
  liquidityProvisions: [
    {
      party: {
        id: 'dde288688af2aeb5feb349dd72d3679a7a9be34c7375f6a4a48ef2f6140e7e59',
        accountsConnection: {
          edges: [
            {
              node: {
                type: AccountType.ACCOUNT_TYPE_BOND,
                balance: '18003328918633596575000',
                __typename: 'AccountBalance',
              },
              __typename: 'AccountEdge',
            },
          ],
          __typename: 'AccountsConnection',
        },
        __typename: 'Party',
      },
      createdAt: '2022-12-16T09:28:29.071781Z',
      updatedAt: '2023-01-04T22:13:27.761985Z',
      commitmentAmount: '18003328918633596575000',
      fee: '0.001',
      status: 'STATUS_ACTIVE',
      __typename: 'LiquidityProvision',
    } as LiquidityProvisionFieldsFragment,
  ],
  liquidityFeeShare: [
    {
      party: {
        id: 'dde288688af2aeb5feb349dd72d3679a7a9be34c7375f6a4a48ef2f6140e7e59',
        __typename: 'Party',
      },
      equityLikeShare: '1',
      averageEntryValuation: '12064118310408958216220.7224556301338111',
      __typename: 'LiquidityProviderFeeShare',
    } as LiquidityProviderFeeShare,
  ],
};

const result = [
  {
    __typename: 'LiquidityProvision',
    averageEntryValuation: '12064118310408958216220.7224556301338111',
    balance: '1.8003328918633596575e+22',
    commitmentAmount: '18003328918633596575000',
    createdAt: '2022-12-16T09:28:29.071781Z',
    equityLikeShare: '1',
    fee: '0.001',
    party: {
      __typename: 'Party',
      accountsConnection: {
        __typename: 'AccountsConnection',
        edges: [
          {
            __typename: 'AccountEdge',
            node: {
              __typename: 'AccountBalance',
              balance: '18003328918633596575000',
              type: 'ACCOUNT_TYPE_BOND',
            },
          },
        ],
      },
      id: 'dde288688af2aeb5feb349dd72d3679a7a9be34c7375f6a4a48ef2f6140e7e59',
    },
    status: 'STATUS_ACTIVE',
    updatedAt: '2023-01-04T22:13:27.761985Z',
  },
];

describe('getLiquidityProvision', () => {
  it('should return an empty array when no data is provided', () => {
    const data = getLiquidityProvision([], []);
    expect(data).toEqual([]);
  });

  it('should return correct array when correct liquidity provision parameters are provided', () => {
    const data = getLiquidityProvision(
      input.liquidityProvisions,
      input.liquidityFeeShare
    );
    expect(data).toStrictEqual(result);
  });

  it('should return empty array when no liquidity provision parameters are provided', () => {
    const data = getLiquidityProvision([], input.liquidityFeeShare);
    expect(data).toStrictEqual([]);
  });

  it('should return empty array when no liquidity fee share param is provided', () => {
    const data = getLiquidityProvision(input.liquidityProvisions, []);
    const result = [
      {
        __typename: 'LiquidityProvision',
        commitmentAmount: '18003328918633596575000',
        createdAt: '2022-12-16T09:28:29.071781Z',
        fee: '0.001',
        party: {
          __typename: 'Party',
          accountsConnection: {
            __typename: 'AccountsConnection',
            edges: [
              {
                __typename: 'AccountEdge',
                node: {
                  __typename: 'AccountBalance',
                  balance: '18003328918633596575000',
                  type: 'ACCOUNT_TYPE_BOND',
                },
              },
            ],
          },
          id: 'dde288688af2aeb5feb349dd72d3679a7a9be34c7375f6a4a48ef2f6140e7e59',
        },
        status: 'STATUS_ACTIVE',
        updatedAt: '2023-01-04T22:13:27.761985Z',
      },
    ];
    expect(data).toStrictEqual(result);
  });
});
