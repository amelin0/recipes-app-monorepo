import React from 'react';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';

/** Marks the run that switches to the italic Black face, e.g. `а <hl>б</hl> в`. */
const HIGHLIGHT_PATTERN = /<hl>([\s\S]*?)<\/hl>/;

export interface HighlightedTitleProps {
    /** Localized sentence containing exactly one `<hl>…</hl>` run. */
    title: string;
    /** Colour token name from `semantic`, or a literal hex for decorative runs. */
    highlight: string;
}

/**
 * Onboarding slide title: Inter Medium uppercase with one italic Black run in a
 * slide-specific colour. Keeping the sentence in a single locale string (rather
 * than three fragments) lets a translator move the highlighted word freely.
 */
export const HighlightedTitle = ({ title, highlight }: HighlightedTitleProps) => {
    const { theme } = useUnistyles();

    const match = title.match(HIGHLIGHT_PATTERN);
    const semantic = theme.colors.semantic as Record<string, string>;
    const color = semantic[highlight] ?? highlight;

    // No marker in the string (e.g. a translation that dropped it) — render the
    // sentence as-is rather than losing the copy.
    if (!match) {
        return (
            <AppText variant="heroTitle" style={styles.title}>
                {title}
            </AppText>
        );
    }

    const [full, accent] = match;
    const start = match.index ?? 0;

    return (
        <AppText variant="heroTitle" style={styles.title}>
            {title.slice(0, start)}
            <AppText variant="heroTitleAccent" style={{ color }}>
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
