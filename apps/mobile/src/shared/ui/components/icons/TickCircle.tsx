import React from 'react';

import TickCircleIcon from '../../../../../assets/icons/tick-circle.svg';

/** Design viewBox of `assets/icons/tick-circle.svg`. */
const VIEW_BOX = 24;
/** The check's stroke width, in points, at every instance size. */
const CHECK_STROKE = 1.5;

export interface TickCircleProps {
    /** Rendered box, in points. The design uses 20, 24 and 36. @default 24 */
    size?: number;
    /** Fill of the disc. The check stays white. */
    color: string;
}

/**
 * Filled tick-circle — vuesax `tick-circle` as the subscription screens draw it
 * (911:52863 at 20, 911:52900 at 24, 911:53725 at 36).
 *
 * Figma exports the check at a flat 1.5px stroke for every one of those sizes
 * rather than scaling it with the frame, so the width is converted back into
 * viewBox units — rendering one 24-unit asset at 36 would otherwise thicken the
 * check to 2.25.
 */
export const TickCircle = ({ size = 24, color }: TickCircleProps) => (
    <TickCircleIcon width={size} height={size} color={color} strokeWidth={(CHECK_STROKE * VIEW_BOX) / size} />
);
