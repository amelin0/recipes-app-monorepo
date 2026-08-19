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

/** Mascot illustration on the profile-setup intro (RF-mobile-app 852:96484). */
export const SETUP_MASCOT_SIZE = 200;

/**
 * Number of questions in the profile-setup questionnaire. Read off the progress
 * bar: the filled run grows by exactly 10pt per step on a 143pt track (13 on
 * step 1 → 43 on step 4), so it reaches full width on step 14.
 */
export const SETUP_STEPS = 16;

/** Selectable birth years — wide enough to cover the whole adult audience. */
export const BIRTH_YEAR_MIN = 1940;
export const BIRTH_YEAR_MAX = 2012;

/** Wheel position the design opens on (66:2356). */
export const DEFAULT_BIRTH_DATE = '1995-01-01';

/** Wheel ranges for the body-metric steps (855:101071, 855:109474). */
export const WEIGHT_KG_MIN = 30;
export const WEIGHT_KG_MAX = 250;
export const HEIGHT_CM_MIN = 130;
export const HEIGHT_CM_MAX = 220;

/**
 * Where the wheels open. The mocks show the first item of each range (30 кг,
 * 130 см), which is the designer scrolling to the top rather than a product
 * default — starting the average user 40kg below their weight would cost more
 * scrolling than it saves.
 */
export const DEFAULT_WEIGHT_KG = 70;
export const DEFAULT_HEIGHT_CM = 170;

export const KG_PER_LB = 0.45359237;
export const CM_PER_INCH = 2.54;

/** Activity levels on the «Наскільки ви активні» step (984:58077). */
export const ACTIVITY_LEVEL_MIN = 1;
export const ACTIVITY_LEVEL_MAX = 8;

/** Goals offered on the «Яка ваша мета?» step, in the designed order. */
export const GOAL_KEYS = ['maintain', 'gain-muscle', 'lose-weight', 'learn-cooking'] as const;

/** Target-weight wheel shares the range of the current-weight step. */
export const TARGET_WEIGHT_KG_MIN = WEIGHT_KG_MIN;
export const TARGET_WEIGHT_KG_MAX = WEIGHT_KG_MAX;

/**
 * Daily goals. The recommendations stand in for the values the API will compute
 * from the questionnaire; the increments are not stated in the design.
 * TODO: replace with GET /profile/recommendations once the API ships.
 */
export const CALORIE_GOAL_DEFAULT = 2000;
export const CALORIE_GOAL_STEP = 50;
export const WATER_GOAL_ML_DEFAULT = 2000;
export const WATER_GOAL_ML_STEP = 100;
export const STEPS_GOAL_DEFAULT = 15000;
export const STEPS_GOAL_STEP = 500;

/**
 * How far the calorie goal may drift from the recommendation before the screen
 * warns about it. The design shows the states but not the thresholds.
 */
export const CALORIE_WARNING_RATIO = 0.2;

/**
 * 12%-alpha halos around the dial (shadow/positive and friends). The orange one
 * is the odd one out: its halo is built from #FF8C40, not from the #FF5200
 * border it surrounds.
 */
export const DIAL_RING = {
    positive: 'rgba(0, 171, 60, 0.12)',
    orange: 'rgba(255, 140, 64, 0.12)',
    negative: 'rgba(255, 0, 33, 0.12)',
    ocean: 'rgba(43, 127, 255, 0.12)',
    grey: 'rgba(30, 41, 50, 0.12)',
} as const;

/** Meal reminders offered right after the notification ask (882:141278). */
