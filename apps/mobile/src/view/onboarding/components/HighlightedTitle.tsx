import React from 'react';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import type { TypographyVariant } from '@/shared/ui/theme';

/** Marks the run that switches to the italic Black face, e.g. `а <hl>б</hl> в`. */
const HIGHLIGHT_PATTERN = /<hl>([\s\S]*?)<\/hl>/;

export interface HighlightedTitleProps {
    /** Localized sentence containing exactly one `<hl>…</hl>` run. */
    title: string;
    /** Colour token name from `semantic` / `branding`, or a literal hex. */
    highlight: string;
    /** Typography of the sentence. @default 'heroTitle' */
    variant?: TypographyVariant;
    /**
     * Typography of the highlighted run. Defaults to the italic Black face the
     * intro slides use; pass the same value as `variant` when only the colour
     * should change (profile-setup intro).
     */
    accentVariant?: TypographyVariant;
}

/**
 * Title with one recoloured run. Keeping the sentence in a single locale string
 * (rather than three fragments) lets a translator move the highlighted word
 * freely. Defaults render the intro-slide look — Inter Medium uppercase with an
 * italic Black run; the profile-setup intro overrides both variants.
 */
export const HighlightedTitle = ({
    title,
    highlight,
    variant = 'heroTitle',
    accentVariant = 'heroTitleAccent',
}: HighlightedTitleProps) => {
    const { theme } = useUnistyles();

    const match = title.match(HIGHLIGHT_PATTERN);
    const semantic = theme.colors.semantic as Record<string, string>;
    const branding = theme.colors.branding as Record<string, string>;
    const color = semantic[highlight] ?? branding[highlight] ?? highlight;

    // No marker in the string (e.g. a translation that dropped it) — render the
    // sentence as-is rather than losing the copy.
    if (!match) {
        return (
            <AppText variant={variant} style={styles.title}>
                {title}
            </AppText>
        );
    }

    const [full, accent] = match;
    const start = match.index ?? 0;

    return (
        <AppText variant={variant} style={styles.title}>
            {title.slice(0, start)}
            <AppText variant={accentVariant} style={{ color }}>
                {accent}
            </AppText>
            {title.slice(start + full.length)}
        </AppText>
    );
};

const styles = StyleSheet.create({
    title: {
        textAlign: 'center',
    },
});
