import { compactRows, updateLevels, VolumeType } from './orderbook-data';
import type { PriceLevelFieldsFragment } from './__generated__/MarketDepth';

describe('compactRows', () => {
  const numberOfRows = 100;
  const middle = 1000;
  const sell: PriceLevelFieldsFragment[] = new Array(numberOfRows)
    .fill(null)
    .map((n, i) => ({
      __typename: 'PriceLevel',
      volume: i.toString(),
      price: (middle + numberOfRows - i).toString(),
      numberOfOrders: i.toString(),
    }));
  const buy: PriceLevelFieldsFragment[] = new Array(numberOfRows)
    .fill(null)
    .map((n, i) => ({
      __typename: 'PriceLevel',
      volume: (numberOfRows - 1 - i).toString(),
      price: (middle - i).toString(),
      numberOfOrders: (numberOfRows - i).toString(),
    }));
  it('groups data by price and resolution', () => {
    expect(compactRows(sell, VolumeType.ask, 1).length).toEqual(100);
    expect(compactRows(buy, VolumeType.bid, 1).length).toEqual(100);
    expect(compactRows(sell, VolumeType.ask, 5).length).toEqual(21);
    expect(compactRows(buy, VolumeType.bid, 5).length).toEqual(21);
    expect(compactRows(sell, VolumeType.ask, 10).length).toEqual(11);
    expect(compactRows(buy, VolumeType.bid, 10).length).toEqual(11);
  });
  it('counts cumulative vol', () => {
    const asks = compactRows(sell, VolumeType.ask, 10);
    const bids = compactRows(buy, VolumeType.bid, 10);
    expect(asks[0].cumulativeVol.value).toEqual(4950);
    expect(bids[0].cumulativeVol.value).toEqual(579);
    expect(asks[10].cumulativeVol.value).toEqual(390);
    expect(bids[10].cumulativeVol.value).toEqual(4950);
    expect(bids[bids.length - 1].cumulativeVol.value).toEqual(4950);
    expect(asks[asks.length - 1].cumulativeVol.value).toEqual(390);
  });

  it('updates relative data', () => {
    const asks = compactRows(sell, VolumeType.ask, 10);
    const bids = compactRows(buy, VolumeType.bid, 10);
    expect(asks[0].cumulativeVol.relativeValue).toEqual(100);
    expect(bids[0].cumulativeVol.relativeValue).toEqual(12);
    expect(asks[10].cumulativeVol.relativeValue).toEqual(8);
    expect(bids[10].cumulativeVol.relativeValue).toEqual(100);
  });
});

describe('updateLevels', () => {
  let levels: PriceLevelFieldsFragment[] = new Array(10)
    .fill(null)
    .map((n, i) => ({
      __typename: 'PriceLevel',
      volume: ((i + 1) * 10).toString(),
      price: ((i + 1) * 10).toString(),
      numberOfOrders: ((i + 1) * 10).toString(),
    }));
  it('updates, removes and adds new items', () => {
    const removeFirstRow: PriceLevelFieldsFragment = {
      __typename: 'PriceLevel',
      price: '10',
      volume: '0',
      numberOfOrders: '0',
    };
    levels = updateLevels(levels, [removeFirstRow]);
    expect(levels[0].price).toEqual('20');
    levels = updateLevels(levels, [removeFirstRow]);
    expect(levels[0].price).toEqual('20');
    expect(updateLevels([], [removeFirstRow])).toEqual([]);
    const addFirstRow: PriceLevelFieldsFragment = {
      __typename: 'PriceLevel',
      price: '10',
      volume: '10',
      numberOfOrders: '10',
    };
    levels = updateLevels(levels, [addFirstRow]);
    expect(levels[0].price).toEqual('10');
    const addBeforeLastRow: PriceLevelFieldsFragment = {
      __typename: 'PriceLevel',
      price: '95',
      volume: '95',
      numberOfOrders: '95',
    };
    levels = updateLevels(levels, [addBeforeLastRow]);
    expect(levels[levels.length - 2].price).toEqual('95');
    const addAtTheEnd: PriceLevelFieldsFragment = {
      __typename: 'PriceLevel',
      price: '115',
      volume: '115',
      numberOfOrders: '115',
    };
    levels = updateLevels(levels, [addAtTheEnd]);
    expect(levels[levels.length - 1].price).toEqual('115');
    const updateLastRow: PriceLevelFieldsFragment = {
      __typename: 'PriceLevel',
      price: '115',
      volume: '116',
      numberOfOrders: '115',
    };
    levels = updateLevels(levels, [updateLastRow]);
    expect(levels[levels.length - 1]).toEqual(updateLastRow);
    expect(updateLevels([], [updateLastRow])).toEqual([updateLastRow]);
  });
});
