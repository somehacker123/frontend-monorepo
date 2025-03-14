import {
  minSafe,
  maxSafe,
  required,
  vegaPublicKey,
  addDecimal,
  formatNumber,
} from '@vegaprotocol/utils';
import { t } from '@vegaprotocol/i18n';
import {
  Button,
  FormGroup,
  Input,
  InputError,
  RichSelect,
  Select,
  Tooltip,
  Checkbox,
} from '@vegaprotocol/ui-toolkit';
import type { Transfer } from '@vegaprotocol/wallet';
import { normalizeTransfer } from '@vegaprotocol/wallet';
import BigNumber from 'bignumber.js';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { AssetOption, Balance } from '@vegaprotocol/assets';

interface FormFields {
  toAddress: string;
  asset: string;
  amount: string;
}

interface TransferFormProps {
  pubKey: string | null;
  pubKeys: string[] | null;
  assets: Array<{
    id: string;
    symbol: string;
    name: string;
    decimals: number;
    balance: string;
  }>;
  assetId?: string;
  feeFactor: string | null;
  submitTransfer: (transfer: Transfer) => void;
}

export const TransferForm = ({
  pubKey,
  pubKeys,
  assets,
  assetId: initialAssetId,
  feeFactor,
  submitTransfer,
}: TransferFormProps) => {
  const {
    control,
    register,
    watch,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormFields>({
    defaultValues: {
      asset: initialAssetId,
    },
  });

  const amount = watch('amount');
  const assetId = watch('asset');

  const [includeFee, setIncludeFee] = useState(false);

  const transferAmount = useMemo(() => {
    if (!amount) return undefined;
    if (includeFee && feeFactor) {
      return new BigNumber(1).minus(feeFactor).times(amount).toString();
    }
    return amount;
  }, [amount, includeFee, feeFactor]);

  const fee = useMemo(() => {
    if (!transferAmount) return undefined;
    if (includeFee) {
      return new BigNumber(amount).minus(transferAmount).toString();
    }
    return (
      feeFactor && new BigNumber(feeFactor).times(transferAmount).toString()
    );
  }, [amount, includeFee, transferAmount, feeFactor]);

  const asset = useMemo(() => {
    return assets.find((a) => a.id === assetId);
  }, [assets, assetId]);

  const onSubmit = useCallback(
    (fields: FormFields) => {
      if (!asset) {
        throw new Error('Submitted transfer with no asset selected');
      }
      if (!transferAmount) {
        throw new Error('Submitted transfer with no amount selected');
      }
      const transfer = normalizeTransfer(fields.toAddress, transferAmount, {
        id: asset.id,
        decimals: asset.decimals,
      });
      submitTransfer(transfer);
    },
    [asset, submitTransfer, transferAmount]
  );

  const min = useMemo(() => {
    // Min viable amount given asset decimals EG for WEI 0.000000000000000001
    const minViableAmount = asset
      ? new BigNumber(addDecimal('1', asset.decimals))
      : new BigNumber(0);
    return minViableAmount;
  }, [asset]);

  const max = useMemo(() => {
    const maxAmount = asset ? new BigNumber(asset.balance) : new BigNumber(0);
    return maxAmount;
  }, [asset]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="text-sm"
      data-testid="transfer-form"
    >
      <FormGroup label="Vega key" labelFor="to-address">
        <AddressField
          pubKeys={pubKeys}
          onChange={() => setValue('toAddress', '')}
          select={
            <Select {...register('toAddress')} id="to-address" defaultValue="">
              <option value="" disabled={true}>
                {t('Please select')}
              </option>
              {pubKeys?.length &&
                pubKeys
                  .filter((pk) => pk !== pubKey) // remove currently selected pubkey
                  .map((pk) => (
                    <option key={pk} value={pk}>
                      {pk}
                    </option>
                  ))}
            </Select>
          }
          input={
            <Input
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={true} // focus input immediately after is shown
              id="to-address"
              type="text"
              {...register('toAddress', {
                validate: {
                  required,
                  vegaPublicKey,
                  sameKey: (value) => {
                    if (value === pubKey) {
                      return t('Vega key is the same as current key');
                    }
                    return true;
                  },
                },
              })}
            />
          }
        />
        {errors.toAddress?.message && (
          <InputError forInput="to-address">
            {errors.toAddress.message}
          </InputError>
        )}
      </FormGroup>
      <FormGroup label="Asset" labelFor="asset">
        <Controller
          control={control}
          name="asset"
          rules={{
            validate: {
              required,
            },
          }}
          render={({ field }) => (
            <RichSelect
              data-testid="select-asset"
              id={field.name}
              name={field.name}
              onValueChange={(value) => {
                field.onChange(value);
              }}
              placeholder={t('Please select an asset')}
              value={field.value}
            >
              {assets.map((a) => (
                <AssetOption
                  key={a.id}
                  asset={a}
                  balance={
                    <Balance
                      balance={formatNumber(a.balance, a.decimals)}
                      symbol={a.symbol}
                    />
                  }
                />
              ))}
            </RichSelect>
          )}
        />
        {errors.asset?.message && (
          <InputError forInput="asset">{errors.asset.message}</InputError>
        )}
      </FormGroup>
      <FormGroup label="Amount" labelFor="amount">
        <Input
          id="amount"
          autoComplete="off"
          appendElement={
            asset && <span className="text-xs">{asset.symbol}</span>
          }
          {...register('amount', {
            validate: {
              required,
              minSafe: (value) => minSafe(new BigNumber(min))(value),
              maxSafe: (v) => {
                const value = new BigNumber(v);
                if (value.isGreaterThan(max)) {
                  return t(
                    'You cannot transfer more than your available collateral'
                  );
                }
                return maxSafe(max)(v);
              },
            },
          })}
        />
        {errors.amount?.message && (
          <InputError forInput="amount">{errors.amount.message}</InputError>
        )}
      </FormGroup>
      <div className="mb-4">
        <Checkbox
          name="include-transfer-fee"
          disabled={!transferAmount}
          label={
            <Tooltip
              description={t(
                `The fee will be taken from the amount you are transferring.`
              )}
            >
              <div>{t('Include transfer fee')}</div>
            </Tooltip>
          }
          checked={includeFee}
          onCheckedChange={() => setIncludeFee(!includeFee)}
        />
      </div>
      {transferAmount && fee && (
        <TransferFee
          amount={transferAmount}
          transferAmount={transferAmount}
          feeFactor={feeFactor}
          fee={fee}
          decimals={asset?.decimals}
        />
      )}
      <Button type="submit" variant="primary" fill={true}>
        {t('Confirm transfer')}
      </Button>
    </form>
  );
};

export const TransferFee = ({
  amount,
  transferAmount,
  feeFactor,
  fee,
  decimals,
}: {
  amount: string;
  transferAmount: string;
  feeFactor: string | null;
  fee?: string;
  decimals?: number;
}) => {
  if (!feeFactor || !amount || !transferAmount || !fee) return null;
  if (
    isNaN(Number(feeFactor)) ||
    isNaN(Number(amount)) ||
    isNaN(Number(transferAmount)) ||
    isNaN(Number(fee))
  ) {
    return null;
  }

  const totalValue = new BigNumber(transferAmount).plus(fee).toString();

  return (
    <div className="mb-4 flex flex-col gap-2 text-xs">
      <div className="flex justify-between gap-1 items-center flex-wrap">
        <Tooltip
          description={t(
            `The transfer fee is set by the network parameter transfer.fee.factor, currently set to %s`,
            [feeFactor]
          )}
        >
          <div>{t('Transfer fee')}</div>
        </Tooltip>

        <div
          data-testid="transfer-fee"
          className="text-neutral-500 dark:text-neutral-300"
        >
          {formatNumber(fee, decimals)}
        </div>
      </div>
      <div className="flex justify-between gap-1 items-center flex-wrap">
        <Tooltip
          description={t(
            `The total amount to be transferred (without the fee)`
          )}
        >
          <div>{t('Amount to be transferred')}</div>
        </Tooltip>

        <div
          data-testid="transfer-amount"
          className="text-neutral-500 dark:text-neutral-300"
        >
          {formatNumber(amount, decimals)}
        </div>
      </div>
      <div className="flex justify-between gap-1 items-center flex-wrap">
        <Tooltip
          description={t(
            `The total amount taken from your account. The amount to be transferred plus the fee.`
          )}
        >
          <div>{t('Total amount (with fee)')}</div>
        </Tooltip>

        <div
          data-testid="total-transfer-fee"
          className="text-neutral-500 dark:text-neutral-300"
        >
          {formatNumber(totalValue, decimals)}
        </div>
      </div>
    </div>
  );
};

interface AddressInputProps {
  pubKeys: string[] | null;
  select: ReactNode;
  input: ReactNode;
  onChange: () => void;
}

export const AddressField = ({
  pubKeys,
  select,
  input,
  onChange,
}: AddressInputProps) => {
  const [isInput, setIsInput] = useState(() => {
    if (pubKeys && pubKeys.length <= 1) {
      return true;
    }
    return false;
  });

  return (
    <>
      {isInput ? input : select}
      {pubKeys && pubKeys.length > 1 && (
        <button
          type="button"
          onClick={() => {
            setIsInput((curr) => !curr);
            onChange();
          }}
          className="ml-auto text-sm absolute top-0 right-0 underline"
        >
          {isInput ? t('Select from wallet') : t('Enter manually')}
        </button>
      )}
    </>
  );
};
