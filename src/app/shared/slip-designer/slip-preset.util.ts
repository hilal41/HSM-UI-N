export interface SlipPresetOption {
  id: string;
  name: string;
  blurb: string;
  recommended?: boolean;
}

export const SLIP_CUSTOM_PRESET_ID = 'custom';

export function markSlipPresetCustom<T extends { presetId: string }>(draft: T): T {
  if (draft.presetId === SLIP_CUSTOM_PRESET_ID) {
    return draft;
  }
  return { ...draft, presetId: SLIP_CUSTOM_PRESET_ID };
}

export function presetDisplayName(
  presetId: string,
  options: SlipPresetOption[],
): string {
  if (presetId === SLIP_CUSTOM_PRESET_ID) {
    return 'Custom layout';
  }
  return options.find((p) => p.id === presetId)?.name ?? 'Custom layout';
}

export function isKnownPresetId(presetId: string, options: SlipPresetOption[]): boolean {
  return options.some((p) => p.id === presetId);
}
