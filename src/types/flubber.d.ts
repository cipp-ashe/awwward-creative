declare module 'flubber' {
  export interface InterpolateOptions {
    maxSegmentLength?: number;
    string?: boolean;
  }

  export function interpolate(
    fromShape: string,
    toShape: string,
    options?: InterpolateOptions
  ): (t: number) => string;

  export function toCircle(
    fromShape: string,
    cx: number,
    cy: number,
    r: number,
    options?: InterpolateOptions
  ): (t: number) => string;

  export function toRect(
    fromShape: string,
    x: number,
    y: number,
    width: number,
    height: number,
    options?: InterpolateOptions
  ): (t: number) => string;

  export function fromCircle(
    cx: number,
    cy: number,
    r: number,
    toShape: string,
    options?: InterpolateOptions
  ): (t: number) => string;

  export function fromRect(
    x: number,
    y: number,
    width: number,
    height: number,
    toShape: string,
    options?: InterpolateOptions
  ): (t: number) => string;

  export function separate(
    fromShape: string,
    toShapes: string[],
    options?: InterpolateOptions
  ): ((t: number) => string)[];

  export function combine(
    fromShapes: string[],
    toShape: string,
    options?: InterpolateOptions
  ): ((t: number) => string)[];

  export function interpolateAll(
    fromShapes: string[],
    toShapes: string[],
    options?: InterpolateOptions & { single?: boolean }
  ): ((t: number) => string)[] | ((t: number) => string);

  export function splitPathString(pathString: string): string[];
}
