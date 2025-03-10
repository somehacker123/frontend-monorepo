import type { ReactNode } from 'react';
import { useState } from 'react';
import { useMemo } from 'react';
import { AssetDetailsTable, useAssetDataProvider } from '@vegaprotocol/assets';
import { t } from '@vegaprotocol/i18n';
import { marketDataProvider } from '../../market-data-provider';
import { totalFeesPercentage } from '../../market-utils';
import { ExternalLink, Splash } from '@vegaprotocol/ui-toolkit';
import {
  addDecimalsFormatNumber,
  formatNumber,
  formatNumberPercentage,
  getMarketExpiryDateFormatted,
} from '@vegaprotocol/utils';
import type { Get } from 'type-fest';
import { MarketInfoTable } from './info-key-value-table';
import type {
  MarketInfo,
  MarketInfoWithData,
} from './market-info-data-provider';
import { Last24hVolume } from '../last-24h-volume';
import BigNumber from 'bignumber.js';
import type { DataSourceDefinition, SignerKind } from '@vegaprotocol/types';
import { ConditionOperatorMapping } from '@vegaprotocol/types';
import { MarketTradingModeMapping } from '@vegaprotocol/types';
import { useEnvironment } from '@vegaprotocol/environment';
import type { Provider } from '../../oracle-schema';
import { OracleBasicProfile } from '../../components/oracle-basic-profile';
import { useOracleProofs } from '../../hooks';
import { OracleDialog } from '../oracle-dialog/oracle-dialog';
import { useDataProvider } from '@vegaprotocol/data-provider';

type MarketInfoProps = {
  market: MarketInfo;
  children?: ReactNode;
};

export const CurrentFeesInfoPanel = ({ market }: MarketInfoProps) => (
  <>
    <MarketInfoTable
      data={{
        makerFee: market.fees.factors.makerFee,
        infrastructureFee: market.fees.factors.infrastructureFee,
        liquidityFee: market.fees.factors.liquidityFee,
        totalFees: totalFeesPercentage(market.fees.factors),
      }}
      asPercentage={true}
    />
    <p className="text-xs">
      {t(
        'All fees are paid by price takers and are a % of the trade notional value. Fees are not paid during auction uncrossing.'
      )}
    </p>
  </>
);

export const MarketPriceInfoPanel = ({ market }: MarketInfoProps) => {
  const assetSymbol =
    market?.tradableInstrument.instrument.product?.settlementAsset.symbol || '';
  const quoteUnit =
    market?.tradableInstrument.instrument.product?.quoteName || '';
  const { data } = useDataProvider({
    dataProvider: marketDataProvider,
    variables: { marketId: market.id },
  });
  return (
    <>
      <MarketInfoTable
        data={{
          markPrice: data?.markPrice,
          bestBidPrice: data?.bestBidPrice,
          bestOfferPrice: data?.bestOfferPrice,
          quoteUnit: market.tradableInstrument.instrument.product.quoteName,
        }}
        decimalPlaces={market.decimalPlaces}
      />
      <p className="text-xs mt-2">
        {t(
          'There is 1 unit of the settlement asset (%s) to every 1 quote unit (%s).',
          [assetSymbol, quoteUnit]
        )}
      </p>
    </>
  );
};

export const MarketVolumeInfoPanel = ({ market }: MarketInfoProps) => {
  const { data } = useDataProvider({
    dataProvider: marketDataProvider,
    variables: { marketId: market.id },
  });

  const dash = (value: string | undefined) =>
    value && value !== '0' ? value : '-';

  return (
    <MarketInfoTable
      data={{
        '24hourVolume': (
          <Last24hVolume
            marketId={market.id}
            positionDecimalPlaces={market.positionDecimalPlaces}
          />
        ),
        openInterest: dash(data?.openInterest),
        bestBidVolume: dash(data?.bestBidVolume),
        bestOfferVolume: dash(data?.bestOfferVolume),
        bestStaticBidVolume: dash(data?.bestStaticBidVolume),
        bestStaticOfferVolume: dash(data?.bestStaticOfferVolume),
      }}
      decimalPlaces={market.positionDecimalPlaces}
    />
  );
};

export const InsurancePoolInfoPanel = ({
  market,
  account,
}: {
  account: NonNullable<
    Get<MarketInfoWithData, 'accountsConnection.edges[0].node'>
  >;
} & MarketInfoProps) => {
  const assetSymbol =
    market?.tradableInstrument.instrument.product?.settlementAsset.symbol || '';
  return (
    <MarketInfoTable
      data={{
        balance: account.balance,
      }}
      assetSymbol={assetSymbol}
      decimalPlaces={
        market.tradableInstrument.instrument.product.settlementAsset.decimals
      }
    />
  );
};

export const KeyDetailsInfoPanel = ({ market }: MarketInfoProps) => {
  const assetDecimals =
    market.tradableInstrument.instrument.product.settlementAsset.decimals;
  return (
    <MarketInfoTable
      data={{
        name: market.tradableInstrument.instrument.name,
        marketID: market.id,
        parentMarketID: market.parentMarketID,
        tradingMode:
          market.tradingMode && MarketTradingModeMapping[market.tradingMode],
        marketDecimalPlaces: market.decimalPlaces,
        positionDecimalPlaces: market.positionDecimalPlaces,
        settlementAssetDecimalPlaces: assetDecimals,
      }}
    />
  );
};

export const InstrumentInfoPanel = ({ market }: MarketInfoProps) => (
  <MarketInfoTable
    data={{
      marketName: market.tradableInstrument.instrument.name,
      code: market.tradableInstrument.instrument.code,
      productType: market.tradableInstrument.instrument.product.__typename,
      quoteName: market.tradableInstrument.instrument.product.quoteName,
    }}
  />
);

export const SettlementAssetInfoPanel = ({ market }: MarketInfoProps) => {
  const assetSymbol =
    market?.tradableInstrument.instrument.product?.settlementAsset.symbol || '';
  const quoteUnit =
    market?.tradableInstrument.instrument.product?.quoteName || '';
  const assetId = useMemo(
    () => market?.tradableInstrument.instrument.product?.settlementAsset.id,
    [market]
  );
  const { data: asset } = useAssetDataProvider(assetId ?? '');
  return asset ? (
    <>
      <AssetDetailsTable
        asset={asset}
        inline={true}
        noBorder={true}
        dtClassName="text-black dark:text-white text-ui !px-0 !font-normal"
        ddClassName="text-black dark:text-white text-ui !px-0 !font-normal max-w-full"
      />
      <p className="text-xs mt-4">
        {t(
          'There is 1 unit of the settlement asset (%s) to every 1 quote unit (%s).',
          [assetSymbol, quoteUnit]
        )}
      </p>
    </>
  ) : (
    <Splash>{t('No data')}</Splash>
  );
};

export const MetadataInfoPanel = ({ market }: MarketInfoProps) => (
  <MarketInfoTable
    data={{
      expiryDate: getMarketExpiryDateFormatted(
        market.tradableInstrument.instrument.metadata.tags
      ),
      ...market.tradableInstrument.instrument.metadata.tags
        ?.map((tag) => {
          const [key, value] = tag.split(':');
          return { [key]: value };
        })
        .reduce((acc, curr) => ({ ...acc, ...curr }), {}),
    }}
  />
);

export const RiskModelInfoPanel = ({ market }: MarketInfoProps) => {
  if (market.tradableInstrument.riskModel.__typename !== 'LogNormalRiskModel') {
    return null;
  }
  const { tau, riskAversionParameter } = market.tradableInstrument.riskModel;
  return <MarketInfoTable data={{ tau, riskAversionParameter }} unformatted />;
};

export const RiskParametersInfoPanel = ({ market }: MarketInfoProps) => {
  if (market.tradableInstrument.riskModel.__typename === 'LogNormalRiskModel') {
    const { r, sigma, mu } = market.tradableInstrument.riskModel.params;
    return <MarketInfoTable data={{ r, sigma, mu }} unformatted />;
  }
  if (market.tradableInstrument.riskModel.__typename === 'SimpleRiskModel') {
    const { factorLong, factorShort } =
      market.tradableInstrument.riskModel.params;
    return <MarketInfoTable data={{ factorLong, factorShort }} unformatted />;
  }
  return null;
};

export const RiskFactorsInfoPanel = ({ market }: MarketInfoProps) => {
  if (!market.riskFactors) {
    return null;
  }
  const { short, long } = market.riskFactors;
  return <MarketInfoTable data={{ short, long }} unformatted />;
};

export const PriceMonitoringBoundsInfoPanel = ({
  market,
  triggerIndex,
}: MarketInfoProps & {
  triggerIndex: number;
}) => {
  const { data } = useDataProvider({
    dataProvider: marketDataProvider,
    variables: { marketId: market.id },
  });
  const quoteUnit =
    market?.tradableInstrument.instrument.product?.quoteName || '';
  const trigger =
    market.priceMonitoringSettings?.parameters?.triggers?.[triggerIndex];
  const bounds = data?.priceMonitoringBounds?.[triggerIndex];
  if (!trigger) {
    console.error(
      `Could not find data for trigger ${triggerIndex} (market id: ${market.id})`
    );
    return null;
  }
  return (
    <>
      <div className="grid grid-cols-2 text-sm mb-2">
        <p className="col-span-1">
          {t('%s probability price bounds', [
            formatNumberPercentage(
              new BigNumber(trigger.probability).times(100)
            ),
          ])}
        </p>
        <p className="col-span-1 text-right">
          {t('Within %s seconds', [formatNumber(trigger.horizonSecs)])}
        </p>
      </div>
      {bounds && (
        <MarketInfoTable
          data={{
            highestPrice: bounds.maxValidPrice,
            lowestPrice: bounds.minValidPrice,
          }}
          decimalPlaces={market.decimalPlaces}
          assetSymbol={quoteUnit}
        />
      )}
      <p className="text-xs mt-2">
        {t('Results in %s seconds auction if breached', [
          trigger.auctionExtensionSecs.toString(),
        ])}
      </p>
    </>
  );
};

export const LiquidityMonitoringParametersInfoPanel = ({
  market,
}: MarketInfoProps) => (
  <MarketInfoTable
    data={{
      triggeringRatio: market.liquidityMonitoringParameters.triggeringRatio,
      timeWindow:
        market.liquidityMonitoringParameters.targetStakeParameters.timeWindow,
      scalingFactor:
        market.liquidityMonitoringParameters.targetStakeParameters
          .scalingFactor,
    }}
  />
);

export const LiquidityInfoPanel = ({ market, children }: MarketInfoProps) => {
  const assetDecimals =
    market.tradableInstrument.instrument.product.settlementAsset.decimals;
  const assetSymbol =
    market?.tradableInstrument.instrument.product?.settlementAsset.symbol || '';
  const { data } = useDataProvider({
    dataProvider: marketDataProvider,
    variables: { marketId: market.id },
  });
  return (
    <>
      <MarketInfoTable
        data={{
          targetStake: data?.targetStake,
          suppliedStake: data?.suppliedStake,
          marketValueProxy: data?.marketValueProxy,
        }}
        decimalPlaces={assetDecimals}
        assetSymbol={assetSymbol}
      />
      {children}
    </>
  );
};

export const LiquidityPriceRangeInfoPanel = ({ market }: MarketInfoProps) => {
  const quoteUnit =
    market?.tradableInstrument.instrument.product?.quoteName || '';
  const liquidityPriceRange = formatNumberPercentage(
    new BigNumber(market.lpPriceRange).times(100)
  );
  const { data } = useDataProvider({
    dataProvider: marketDataProvider,
    variables: { marketId: market.id },
  });
  return (
    <>
      <p className="text-sm mb-2">
        {`For liquidity orders to count towards a commitment, they must be
            within the liquidity monitoring bounds.`}
      </p>
      <p className="text-sm mb-2">
        {`The liquidity price range is a ${liquidityPriceRange} difference from the mid
            price.`}
      </p>
      <MarketInfoTable
        data={{
          liquidityPriceRange: `${liquidityPriceRange} of mid price`,
          lowestPrice:
            data?.midPrice &&
            `${addDecimalsFormatNumber(
              new BigNumber(1)
                .minus(market.lpPriceRange)
                .times(data.midPrice)
                .toString(),
              market.decimalPlaces
            )} ${quoteUnit}`,
          highestPrice:
            data?.midPrice &&
            `${addDecimalsFormatNumber(
              new BigNumber(1)
                .plus(market.lpPriceRange)
                .times(data.midPrice)
                .toString(),
              market.decimalPlaces
            )} ${quoteUnit}`,
        }}
      />
    </>
  );
};

export const OracleInfoPanel = ({
  market,
  type,
}: MarketInfoProps & { type: 'settlementData' | 'termination' }) => {
  const product = market.tradableInstrument.instrument.product;
  const { VEGA_EXPLORER_URL, ORACLE_PROOFS_URL } = useEnvironment();
  const { data } = useOracleProofs(ORACLE_PROOFS_URL);

  const dataSourceSpecId =
    type === 'settlementData'
      ? product.dataSourceSpecForSettlementData.id
      : product.dataSourceSpecForTradingTermination.id;

  const dataSourceSpec = (
    type === 'settlementData'
      ? product.dataSourceSpecForSettlementData.data
      : product.dataSourceSpecForTradingTermination.data
  ) as DataSourceDefinition;

  return (
    <div className="flex flex-col gap-2">
      <DataSourceProof
        data-testid="oracle-proof-links"
        data={dataSourceSpec}
        providers={data}
        type={type}
        dataSourceSpecId={dataSourceSpecId}
      />
      <ExternalLink
        data-testid="oracle-spec-links"
        href={`${VEGA_EXPLORER_URL}/oracles/${
          type === 'settlementData'
            ? product.dataSourceSpecForSettlementData.id
            : product.dataSourceSpecForTradingTermination.id
        }`}
      >
        {type === 'settlementData'
          ? t('View settlement data specification')
          : t('View termination specification')}
      </ExternalLink>
    </div>
  );
};

export const DataSourceProof = ({
  data,
  providers,
  type,
  dataSourceSpecId,
}: {
  data: DataSourceDefinition;
  providers: Provider[] | undefined;
  type: 'settlementData' | 'termination';
  dataSourceSpecId: string;
}) => {
  if (data.sourceType.__typename === 'DataSourceDefinitionExternal') {
    const signers = data.sourceType.sourceType.signers || [];

    if (!providers?.length) {
      return <NoOracleProof type={type} />;
    }

    return (
      <div className="flex flex-col gap-2">
        {signers.map(({ signer }, i) => {
          return (
            <OracleLink
              key={i}
              providers={providers}
              signer={signer}
              type={type}
              dataSourceSpecId={dataSourceSpecId}
            />
          );
        })}
      </div>
    );
  }

  if (data.sourceType.__typename === 'DataSourceDefinitionInternal') {
    if (data.sourceType.sourceType) {
      return (
        <div>
          <h3>{t('Internal conditions')}</h3>
          {data.sourceType.sourceType?.conditions.map((condition, i) => {
            if (!condition) return null;
            return (
              <p key={i}>
                {ConditionOperatorMapping[condition.operator]} {condition.value}
              </p>
            );
          })}
        </div>
      );
    } else {
      return (
        <div>
          {t('No oracle spec for trading termination. Internal timestamp used')}
        </div>
      );
    }
  }

  return <div>{t('Invalid data source')}</div>;
};

const OracleLink = ({
  providers,
  signer,
  type,
  dataSourceSpecId,
}: {
  providers: Provider[];
  signer: SignerKind;
  type: 'settlementData' | 'termination';
  dataSourceSpecId: string;
}) => {
  const signerProviders = providers.filter((p) => {
    if (signer.__typename === 'PubKey') {
      if (
        p.oracle.type === 'public_key' &&
        p.oracle.public_key === signer.key
      ) {
        return true;
      }
    }

    if (signer.__typename === 'ETHAddress') {
      if (
        p.oracle.type === 'eth_address' &&
        p.oracle.eth_address === signer.address
      ) {
        return true;
      }
    }

    return false;
  });

  if (!signerProviders.length) {
    return <NoOracleProof type={type} />;
  }

  return (
    <div className="mt-2">
      {signerProviders.map((provider) => (
        <OracleProfile
          key={dataSourceSpecId}
          provider={provider}
          dataSourceSpecId={dataSourceSpecId}
        />
      ))}
    </div>
  );
};

const NoOracleProof = ({
  type,
}: {
  type: 'settlementData' | 'termination';
}) => {
  return (
    <p>
      {t(
        'No oracle proof for %s',
        type === 'settlementData' ? 'settlement data' : 'termination'
      )}
    </p>
  );
};

const OracleProfile = (props: {
  provider: Provider;
  dataSourceSpecId: string;
}) => {
  const [open, onChange] = useState(false);
  return (
    <div key={props.provider.name}>
      <OracleBasicProfile
        provider={props.provider}
        onClick={() => onChange(!open)}
      />
      <OracleDialog {...props} open={open} onChange={onChange} />
    </div>
  );
};
