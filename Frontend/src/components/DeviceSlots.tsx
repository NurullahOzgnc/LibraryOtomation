import React from 'react';
import { Tooltip } from 'antd';
import type { Device } from '@/types';

interface Props {
  device: Device;
  isAdmin?: boolean;
  onToggleBroken?: (newBrokenCount: number) => Promise<void> | void;
  onReserve?: (slotIndex: number) => void;
}

const boxSize = 26;

const DeviceSlots: React.FC<Props> = ({ device, isAdmin = false, onToggleBroken, onReserve }) => {
  const total = device.totalQuantity;
  const broken = device.brokenCount ?? 0;
  const reserved = Math.max((device.totalQuantity - (device.availableQuantity ?? device.totalQuantity)), 0);

  // Build slots: first broken, then reserved, then free
  const slots: ('BROKEN' | 'RESERVED' | 'FREE')[] = [];
  for (let i = 0; i < broken; i++) slots.push('BROKEN');
  for (let i = 0; i < reserved && slots.length < total; i++) slots.push('RESERVED');
  while (slots.length < total) slots.push('FREE');

  const handleClick = (index: number, status: typeof slots[number]) => {
    if (isAdmin && onToggleBroken) {
      if (status !== 'BROKEN') {
        return;
      }
      const newBroken = Math.max(broken - 1, 0);
      onToggleBroken(newBroken);
      return;
    }
    if (!isAdmin && status === 'FREE' && onReserve) {
      onReserve(index);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {slots.map((s, idx) => {
          const bg = s === 'BROKEN' ? '#ff4d4f' : s === 'RESERVED' ? '#52c41a' : '#d9d9d9';
          const title = s === 'BROKEN' ? 'Arızalı' : s === 'RESERVED' ? 'Rezerve' : 'Boş';
          return (
            <Tooltip key={idx} title={title}>
              <div
                onClick={() => handleClick(idx, s)}
                style={{
                  width: boxSize,
                  height: boxSize,
                  borderRadius: 4,
                  background: bg,
                  cursor: isAdmin ? (s === 'BROKEN' ? 'pointer' : 'not-allowed') : s === 'FREE' ? 'pointer' : 'not-allowed',
                  display: 'inline-block',
                }}
              />
            </Tooltip>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: '#595959' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: '#ff4d4f', display: 'inline-block' }} />
          Arızalı: {broken}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: '#52c41a', display: 'inline-block' }} />
          Rezerve: {slots.filter((slot) => slot === 'RESERVED').length}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: '#d9d9d9', display: 'inline-block' }} />
          Boş: {slots.filter((slot) => slot === 'FREE').length}
        </div>
      </div>
    </div>
  );
};

export default DeviceSlots;
