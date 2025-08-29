declare module 'clipper-lib' {
  export interface Point {
    X: number
    Y: number
  }

  export interface Path extends Array<Point> {}

  export enum PolyType {
    ptSubject = 0,
    ptClip = 1
  }

  export enum ClipType {
    ctIntersection = 0,
    ctUnion = 1,
    ctDifference = 2,
    ctXor = 3
  }

  export enum PolyFillType {
    pftEvenOdd = 0,
    pftNonZero = 1,
    pftPositive = 2,
    pftNegative = 3
  }

  export enum JoinType {
    jtSquare = 0,
    jtRound = 1,
    jtMiter = 2
  }

  export enum EndType {
    etClosedPolygon = 0,
    etClosedLine = 1,
    etOpenButt = 2,
    etOpenSquare = 3,
    etOpenRound = 4
  }

  export class Clipper {
    AddPaths(paths: Path[], polyType: PolyType, closed: boolean): void
    Execute(clipType: ClipType, solution: Path[], subjFillType: PolyFillType, clipFillType: PolyFillType): boolean
  }

  export class ClipperOffset {
    constructor(miterLimit: number, arcTolerance: number)
    AddPaths(paths: Path[], joinType: JoinType, endType: EndType): void
    Execute(solution: Path[], delta: number): void
  }

  const ClipperLib: {
    Clipper: typeof Clipper
    ClipperOffset: typeof ClipperOffset
    PolyType: typeof PolyType
    ClipType: typeof ClipType
    PolyFillType: typeof PolyFillType
    JoinType: typeof JoinType
    EndType: typeof EndType
  }

  export default ClipperLib
}
