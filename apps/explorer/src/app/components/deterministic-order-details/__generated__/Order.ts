import { Schema as Types } from '@vegaprotocol/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ExplorerDeterministicOrderFieldsFragment = { __typename?: 'Order', id: string, type?: Types.OrderType | null, reference: string, status: Types.OrderStatus, version: string, createdAt: any, expiresAt?: any | null, timeInForce: Types.OrderTimeInForce, price: string, side: Types.Side, remaining: string, size: string, rejectionReason?: Types.OrderRejectionReason | null, party: { __typename?: 'Party', id: string }, market: { __typename?: 'Market', id: string, decimalPlaces: number, tradableInstrument: { __typename?: 'TradableInstrument', instrument: { __typename?: 'Instrument', name: string } } } };

export type ExplorerDeterministicOrderQueryVariables = Types.Exact<{
  orderId: Types.Scalars['ID'];
}>;


export type ExplorerDeterministicOrderQuery = { __typename?: 'Query', orderByID: { __typename?: 'Order', id: string, type?: Types.OrderType | null, reference: string, status: Types.OrderStatus, version: string, createdAt: any, expiresAt?: any | null, timeInForce: Types.OrderTimeInForce, price: string, side: Types.Side, remaining: string, size: string, rejectionReason?: Types.OrderRejectionReason | null, party: { __typename?: 'Party', id: string }, market: { __typename?: 'Market', id: string, decimalPlaces: number, tradableInstrument: { __typename?: 'TradableInstrument', instrument: { __typename?: 'Instrument', name: string } } } } };

export const ExplorerDeterministicOrderFieldsFragmentDoc = gql`
    fragment ExplorerDeterministicOrderFields on Order {
  id
  type
  reference
  status
  version
  createdAt
  expiresAt
  timeInForce
  price
  side
  remaining
  size
  rejectionReason
  party {
    id
  }
  market {
    id
    decimalPlaces
    tradableInstrument {
      instrument {
        name
      }
    }
  }
}
    `;
export const ExplorerDeterministicOrderDocument = gql`
    query ExplorerDeterministicOrder($orderId: ID!) {
  orderByID(id: $orderId) {
    ...ExplorerDeterministicOrderFields
  }
}
    ${ExplorerDeterministicOrderFieldsFragmentDoc}`;

/**
 * __useExplorerDeterministicOrderQuery__
 *
 * To run a query within a React component, call `useExplorerDeterministicOrderQuery` and pass it any options that fit your needs.
 * When your component renders, `useExplorerDeterministicOrderQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useExplorerDeterministicOrderQuery({
 *   variables: {
 *      orderId: // value for 'orderId'
 *   },
 * });
 */
export function useExplorerDeterministicOrderQuery(baseOptions: Apollo.QueryHookOptions<ExplorerDeterministicOrderQuery, ExplorerDeterministicOrderQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ExplorerDeterministicOrderQuery, ExplorerDeterministicOrderQueryVariables>(ExplorerDeterministicOrderDocument, options);
      }
export function useExplorerDeterministicOrderLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ExplorerDeterministicOrderQuery, ExplorerDeterministicOrderQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ExplorerDeterministicOrderQuery, ExplorerDeterministicOrderQueryVariables>(ExplorerDeterministicOrderDocument, options);
        }
export type ExplorerDeterministicOrderQueryHookResult = ReturnType<typeof useExplorerDeterministicOrderQuery>;
export type ExplorerDeterministicOrderLazyQueryHookResult = ReturnType<typeof useExplorerDeterministicOrderLazyQuery>;
export type ExplorerDeterministicOrderQueryResult = Apollo.QueryResult<ExplorerDeterministicOrderQuery, ExplorerDeterministicOrderQueryVariables>;