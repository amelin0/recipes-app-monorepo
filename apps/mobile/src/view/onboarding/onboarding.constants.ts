import type { ImageSourcePropType } from 'react-native';

export interface OnboardingSlide {
    key: string;
    /** Illustration, 300×300 in the design (RF-mobile-app 66:2252…66:2316). */
    image: ImageSourcePropType;
    /**
     * Colour of the highlighted run inside the title. The first three map to
     * semantic tokens; the last two are slide-specific decorative literals that
     * have no RFDS variable behind them.
     */
    highlight: 'positive' | 'negative' | 'orange' | string;
}

/** Order defines the slide order and therefore the pagination dots. */
export const ONBOARDING_SLIDES: OnboardingSlide[] = [
    { key: 'plan', image: require('../../../assets/images/onboarding/slide-1-plan.jpg'), highlight: 'positive' },
    { key: 'macros', image: require('../../../assets/images/onboarding/slide-2-macros.jpg'), highlight: 'negative' },
    { key: 'tasty', image: require('../../../assets/images/onboarding/slide-3-tasty.jpg'), highlight: 'orange' },
    { key: 'recipes', image: require('../../../assets/images/onboarding/slide-4-recipes.jpg'), highlight: '#D38F31' },
    { key: 'desserts', image: require('../../../assets/images/onboarding/slide-5-desserts.jpg'), highlight: '#8231D3' },
];

/** Width of the Figma frame the onboarding was drawn on. */
export const DESIGN_FRAME_WIDTH = 375;

/** Illustration box on that frame — 80% of the width, kept proportional on other phones. */
export const SLIDE_IMAGE_SIZE = 300;

/**
 * Distance from the safe-area top to the title block. Design places the title
 * at y=98 on a 812pt frame whose status bar is 44pt.
 */
export const SLIDE_TOP_OFFSET = 54;

/** Two lines at 24/31.2 plus the frame's 16pt padding. */
export const TITLE_BOX_HEIGHT = 94;

/**
 * Everything below the illustration that keeps a fixed height: the dots (8),
 * the footer (two 56pt CTAs, a 16pt gap and 40pt of bottom inset) and the
 * smallest gap we still want to see under the artwork. Subtracting this from
 * the viewport is what stops a 375x667 phone from clipping the illustration.
 */
export const SLIDE_BOTTOM_CHROME = 8 + 56 + 16 + 56 + 40 + 24;
