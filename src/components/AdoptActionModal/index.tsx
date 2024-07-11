import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Button } from 'aelf-design';
import Balance from 'components/Balance';
import CommonModal from 'components/CommonModal';
import InfoCard, { IInfoCard } from 'components/InfoCard';
import SGRAmountInput, { ISGRAmountInputInterface, ISGRAmountInputProps } from 'components/SGRAmountInput';
import { DEFAULT_TOKEN_SYMBOL } from 'constants/assets';
import { ONE, ZERO } from 'constants/misc';
import { useTokenPrice, useTxFee } from 'hooks/useAssets';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReactComponent as InfoSVG } from 'assets/img/icons/info.svg';
import BigNumber from 'bignumber.js';
import AdoptRulesModal from 'components/AdoptRulesModal';
import { ADOPT_NEXT_MIN, ADOPT_NEXT_RATE, DIRECT_ADOPT_GEN9_MIN, DIRECT_ADOPT_GEN9_RATE } from 'constants/common';
import { getOriginSymbol } from 'utils';
import { renameSymbol } from 'utils/renameSymbol';

export type TBalanceItem = {
  amount: string;
  suffix: string;
  usd: string;
};

export type TAdoptActionModalProps = {
  modalTitle?: string;
  modalSubTitle?: string;
  isDirect?: boolean;
  info: IInfoCard;
  onClose?: <T>(params?: T) => void;
  onConfirm?: (amount: string) => void;
  balanceList?: TBalanceItem[];
  inputProps?: ISGRAmountInputProps;
  isReset?: boolean;
};

function AdoptActionModal(params: TAdoptActionModalProps) {
  const modal = useModal();
  const adoptRulesModal = useModal(AdoptRulesModal);
  const {
    modalTitle,
    modalSubTitle,
    info,
    onClose,
    isDirect,
    onConfirm: onConfirmProps,
    balanceList,
    inputProps,
    isReset = false,
  } = params;
  const sgrAmountInputRef = useRef<ISGRAmountInputInterface>();

  const onCancel = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }
    modal.hide();
  }, [modal, onClose]);

  const { txFee } = useTxFee();
  const { tokenPrice } = useTokenPrice();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [showBuy, setShowBuy] = useState<boolean>(false);

  const [isInvalid, setIsInvalid] = useState(true);
  const isInvalidRef = useRef(isInvalid);
  isInvalidRef.current = isInvalid;
  const onConfirm = useCallback(() => {
    if (isInvalidRef.current) return;
    const sgrAmountInput = sgrAmountInputRef.current;
    if (!sgrAmountInput) return;
    const amount = sgrAmountInput.getAmount();

    if (inputProps?.max && BigNumber(amount).gt(inputProps?.max)) {
      setErrorMessage('Insufficient cat to consume. ');
      setShowBuy(true);
      return;
    }

    if (inputProps?.max && BigNumber(amount).eq(inputProps?.max)) {
      if (isDirect && !isReset && DIRECT_ADOPT_GEN9_RATE.times(amount).lt(ONE)) {
        setErrorMessage(
          `Insufficient balance, you need at least ${DIRECT_ADOPT_GEN9_MIN} $SGR to adopt 1 9th-Gen cat, `,
        );
        setShowBuy(true);
        return;
      }
      if (!isReset && ADOPT_NEXT_RATE.times(amount).lt(ONE)) {
        setErrorMessage(`Insufficient balance, you need at least ${ADOPT_NEXT_MIN} $SGR to adopt 1 next-Gen cat, `);
        setShowBuy(true);
        return;
      }
    }

    setShowBuy(false);

    if (isDirect && !isReset && DIRECT_ADOPT_GEN9_RATE.times(amount).lt(ONE)) {
      setErrorMessage(
        `Please enter at least ${DIRECT_ADOPT_GEN9_MIN} SGR to ensure you can receive 1 9th-gen cat with one click.`,
      );
      return;
    }

    if (!isReset && ADOPT_NEXT_RATE.times(amount).lt(ONE)) {
      setErrorMessage(`Please enter at least ${ADOPT_NEXT_MIN} to ensure you can receive at least 1 next-gen cat.`);
      return;
    }

    onConfirmProps && onConfirmProps(amount);
  }, [inputProps?.max, isDirect, isReset, onConfirmProps]);

  const [amount, setAmount] = useState<string>('');
  const receiveToken = useMemo(() => {
    if (amount === '') return '--';
    const amountNumber = ZERO.plus(amount);
    if (amountNumber.eq(ZERO)) return '--';
    if (isReset) return amount;
    const rate = isDirect ? DIRECT_ADOPT_GEN9_RATE : ADOPT_NEXT_RATE;
    return ZERO.plus(amountNumber.multipliedBy(rate).toFixed(8)).toFixed();
  }, [amount, isDirect, isReset]);

  const adoptFee = useMemo(() => {
    if (isReset) return '--';
    if (amount === '') return '--';
    const amountNumber = ZERO.plus(amount);
    if (amountNumber.eq(ZERO)) return '--';
    return ZERO.plus(amountNumber).minus(receiveToken).toFixed();
  }, [amount, isReset, receiveToken]);

  const priceAmount = useMemo(() => {
    if (!tokenPrice) return '0';
    return ZERO.plus(txFee).multipliedBy(tokenPrice).toFixed(4);
  }, [tokenPrice, txFee]);

  const rateValue = useMemo(() => {
    if (isReset) return `Reroll 1 ${info.name} receive 1 ${renameSymbol(getOriginSymbol(info.name))}`;
    return isDirect
      ? `Consume ${DIRECT_ADOPT_GEN9_MIN} $SGR to adopt one 9th-Gen cat`
      : `Consume ${ADOPT_NEXT_MIN} ${info.name} to adopt 1 next-gen cat `;
  }, [info.name, isDirect, isReset]);

  const inputTitle = useMemo(() => {
    if (isReset) return 'Reroll Amount';
    return 'Consume Amount';
  }, [isReset]);

  const inputDescription = useMemo(() => {
    if (isReset)
      return `By rerolling, your cat will be reverted back to its original status (Gen0) and you will receive ${renameSymbol(
        getOriginSymbol(info.name),
      )}.`;
    return '';
  }, [info.name, isReset]);

  const inputPlaceholder = useMemo(() => {
    if (isReset) return 'Consume Amount';
    return 'Consume Amount';
  }, [isReset]);

  const rateLabel = useMemo(() => {
    if (isReset) return 'Rate';
    return 'Adoption Fee Rate';
  }, [isReset]);

  const receiveLabel = useMemo(() => {
    if (isReset) return 'Ets. Receive Token';
    return 'Amount to Be Received';
  }, [isReset]);

  const confirmBtn = useMemo(
    () => (
      <Button className="md:w-[356px]" disabled={isInvalid} onClick={() => onConfirm && onConfirm()} type="primary">
        {isReset ? 'Reroll' : 'Adopt'}
      </Button>
    ),
    [isInvalid, isReset, onConfirm],
  );

  useEffect(() => {
    setErrorMessage('');
    setShowBuy(false);
  }, [amount]);

  const onAdoptRulesClick = useCallback(() => {
    adoptRulesModal.show();
  }, [adoptRulesModal]);

  return (
    <CommonModal
      title={modalTitle}
      open={modal.visible}
      onOk={() => onConfirm && onConfirm()}
      onCancel={onCancel}
      afterClose={modal.remove}
      footer={confirmBtn}>
      {modalSubTitle ? <div className="mb-[16px] text-sm text-neutralSecondary">{modalSubTitle}</div> : null}
      {!isReset && (
        <div className="flex bg-brandBg py-[14px] px-[16px] rounded-md mb-[24px] md:mb-[32px]">
          <InfoSVG className="flex-shrink-0" />
          <span className="ml-[8px] text-neutralPrimary">
            Learn more about the{' '}
            <span className="text-brandDefault cursor-pointer" onClick={onAdoptRulesClick}>
              adoption rules
            </span>
            .
          </span>
        </div>
      )}
      <InfoCard {...info} />
      <SGRAmountInput
        ref={sgrAmountInputRef}
        title={inputTitle}
        tips={
          isReset
            ? undefined
            : [
                'After adoption, embrace your next-gen cat with a new trait randomly generated by Al. You can view the new cats and select from the two options the one you prefer.',
                "Usually, cats gain only one trait per adoption. However, there's a chance of triggering a cross-level adoption—a lucky surprise—where your cat will gain multiple traits at once.",
                'When adopting a next-gen cat, a 5% adoption fee will be charged; upgrading directly to the 9th generation cat consumes a total of 37.5%.',
                'Please ensure you enter an adequate amount if you want to eventually have at least 1 Gen9 cat.',
              ]
        }
        description={inputDescription}
        className="mt-[32px] mb-[32px]"
        onInvalidChange={setIsInvalid}
        onChange={setAmount}
        status={errorMessage ? 'error' : ''}
        errorMessage={errorMessage}
        showBuy={showBuy && info.tag === 'GEN 0'}
        placeholder={inputPlaceholder}
        {...inputProps}
      />
      <div className="flex flex-col lg:flex-row justify-between mb-[16px]">
        <span className="text-neutralSecondary">{receiveLabel}</span>
        <span className="text-neutralTitle mt-[4px] lg:mt-0">{receiveToken}</span>
      </div>
      <div className="flex flex-col lg:flex-row justify-between mb-[16px]">
        <span className="text-neutralSecondary flex items-center gap-[8px]">{rateLabel}</span>
        <span className="text-neutralTitle mt-[4px] lg:mt-0">{rateValue}</span>
      </div>
      {!isReset && (
        <div className="flex flex-col lg:flex-row justify-between mb-[16px]">
          <span className="text-neutralSecondary">Adoption Fee to Be Charged</span>
          <span className="text-neutralTitle mt-[4px] lg:mt-0">{adoptFee}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between mb-[16px]">
        <span className="text-neutralSecondary">Transaction Fee</span>
        <div className="flex flex-col items-start lg:items-end  mt-[4px] lg:mt-0">
          <span className="text-neutralTitle">
            {txFee} {DEFAULT_TOKEN_SYMBOL}
          </span>
          {tokenPrice && <span className="text-neutralSecondary mt-[4px]">$ {priceAmount}</span>}
        </div>
      </div>

      {balanceList && balanceList.length && <Balance items={balanceList} className="mt-[32px]" />}
    </CommonModal>
  );
}

export default NiceModal.create(AdoptActionModal);
