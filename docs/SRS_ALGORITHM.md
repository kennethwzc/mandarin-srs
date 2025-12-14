# Spaced Repetition Algorithm

## Overview

This app uses a modified SM-2 algorithm for spaced repetition learning.

## Algorithm Details

The SM-2 algorithm calculates optimal review intervals based on:

- Ease Factor (EF): How easy the item is for the user
- Interval: Days until next review
- Repetitions: Number of successful reviews

## Quality Ratings

- 0: Blackout (complete failure)
- 1: Incorrect response
- 2: Incorrect response (but easy)
- 3: Correct response (but hard)
- 4: Correct response
- 5: Correct response (easy)

## Implementation

See `lib/utils/srs-algorithm.ts` for the implementation.

## Future Enhancements

- Customizable algorithm parameters
- Per-user algorithm tuning
- Adaptive difficulty based on performance
