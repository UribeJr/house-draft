// Snake draft math. Mirrors the SQL in make_draft_pick — keep them in sync.

/** 1-indexed round for a 1-indexed pick number. */
export function roundForPick(pickNumber: number, teamCount: number): number {
  return Math.ceil(pickNumber / teamCount);
}

/** Draft position (1..teamCount) on the clock for a 1-indexed pick number. */
export function positionForPick(pickNumber: number, teamCount: number): number {
  const round = roundForPick(pickNumber, teamCount);
  const i = (pickNumber - 1) % teamCount;
  return round % 2 === 1 ? i + 1 : teamCount - i;
}

/** Pick number for a given round + draft position (for rendering the board grid). */
export function pickForCell(round: number, position: number, teamCount: number): number {
  const offset = round % 2 === 1 ? position - 1 : teamCount - position;
  return (round - 1) * teamCount + offset + 1;
}
