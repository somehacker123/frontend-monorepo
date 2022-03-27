import { useRef, useCallback } from 'react';
import { produce } from 'immer';
import merge from 'lodash/merge';
import { useRouter } from 'next/router';
import { AsyncRenderer } from '../../components/async-renderer';
import { MarketListTable, getRowNodeId } from '@vegaprotocol/market-list';
import {
  Markets_markets,
  Markets_markets_data,
  marketsDataProvider,
} from '@vegaprotocol/graphql';
import { useDataProvider } from '@vegaprotocol/react-helpers';

import type { AgGridReact } from 'ag-grid-react';

const Markets = () => {
  const { pathname, push } = useRouter();
  const gridRef = useRef<AgGridReact>();
  const update = useCallback(
    (delta: Markets_markets_data) => {
      const update: Markets_markets[] = [];
      const add: Markets_markets[] = [];
      if (!gridRef.current) {
        return false;
      }
      const rowNode = gridRef.current.api.getRowNode(
        getRowNodeId(delta.market)
      );
      if (rowNode) {
        const updatedData = produce<Markets_markets_data>(
          rowNode.data.data,
          (draft: Markets_markets_data) => merge(draft, delta)
        );
        if (updatedData !== rowNode.data.data) {
          update.push({ ...rowNode.data, data: updatedData });
        }
      }
      // @TODO - else add new market
      if (update.length || add.length) {
        gridRef.current.api.applyTransactionAsync({
          update,
          add,
          addIndex: 0,
        });
      }
      return true;
    },
    [gridRef]
  );
  const { data, error, loading } = useDataProvider<
    Markets_markets,
    Markets_markets_data
  >(marketsDataProvider, update);

  return (
    <AsyncRenderer loading={loading} error={error} data={data}>
      {(data) => (
        <MarketListTable
          ref={gridRef}
          data={data}
          onRowClicked={(id) =>
            push(`${pathname}/${id}?portfolio=orders&trade=orderbook`)
          }
        />
      )}
    </AsyncRenderer>
  );
};

export default Markets;
