import { useEffect, useRef } from 'react';

import { useLanguage, type SupportedLanguage } from '@/shared/utils/translations';
import { useStore } from '@/state';
import { UNIT_QUANTITIES } from '@/state/domains/app';

import { toAppTheme, toUnitPreferences } from '../user.mappers';

import { useGetProfile } from './useGetProfile';

/**
 * Mirrors the server's settings into the local store once per session.
 *
 * The store keeps them because unit conversion and theming run synchronously
 * in render, where awaiting a query is not an option — but the server is the
 * source of truth, so a sign-in on a second device must not keep this one's
 * stale preferences.
 *
 * Applied once, not on every refetch: a later refetch that landed while the
 * user was mid-selection would yank the radio row back under their finger.
 */
export const useSyncSettings = () => {
    const { data: profile } = useGetProfile();
    const { currentLanguage, changeLanguage } = useLanguage();

    const setAppTheme = useStore(state => state.setAppTheme);
    const setUnitPreference = useStore(state => state.setUnitPreference);

    const syncedFor = useRef<string | null>(null);

    useEffect(() => {
        if (!profile || syncedFor.current === profile.id) return;
        syncedFor.current = profile.id;

        const units = toUnitPreferences(profile.settings);
        UNIT_QUANTITIES.forEach(quantity => setUnitPreference(quantity, units[quantity]));

        setAppTheme(toAppTheme(profile.settings.theme));

        if (profile.settings.language !== currentLanguage) {
            void changeLanguage(profile.settings.language as SupportedLanguage);
        }
    }, [profile, currentLanguage, changeLanguage, setAppTheme, setUnitPreference]);
};
