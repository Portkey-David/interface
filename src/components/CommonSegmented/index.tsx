import React from 'react';
import styles from './index.module.css';
import clsx from 'clsx';
import { Segmented, ConfigProvider, SegmentedProps } from 'antd';
import { themeDarkSegmentedConfig, themeSegmentedConfig } from './config';
import { SegmentedValue } from 'antd/es/segmented';
import { ListTypeEnum } from 'types';
import { TModalTheme } from 'components/CommonModal';

interface IProps {
  options: SegmentedProps['options'];
  value: SegmentedValue | ListTypeEnum;
  theme?: TModalTheme;
  onSegmentedChange?: (value?: SegmentedValue | ListTypeEnum) => void;
  className?: string;
}

function CommonSegmented({ onSegmentedChange, value, className, options, theme }: IProps) {
  return (
    <ConfigProvider theme={theme === 'dark' ? themeDarkSegmentedConfig : themeSegmentedConfig}>
      <div
        className={clsx(
          styles['common-segmented'],
          theme === 'dark' && styles['common-segmented-dark'],
          'h-[48px] w-full',
          className,
        )}>
        <Segmented
          block
          onChange={(value) => onSegmentedChange && onSegmentedChange(value)}
          value={value}
          size="large"
          options={options}
        />
      </div>
    </ConfigProvider>
  );
}

export default React.memo(CommonSegmented);
