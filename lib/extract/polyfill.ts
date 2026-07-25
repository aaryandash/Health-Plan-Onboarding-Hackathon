/**
 * Minimal DOM shims for pdfjs-dist under Node.
 *
 * pdfjs-dist's legacy build references DOMMatrix, Path2D and ImageData at
 * module evaluation. Node has none of them, so importing it throws
 * "ReferenceError: DOMMatrix is not defined" before any of our code runs —
 * which is why the route's try/catch never fired and uploads returned 500.
 *
 * The real answer is @napi-rs/canvas, but that is a native binary we do not
 * need: we only pull the text layer, never rasterise a page. These stubs exist
 * purely to get module evaluation past the reference. If anything ever
 * actually renders, it will produce nothing rather than crash.
 *
 * Import this before anything that reaches pdfjs-dist.
 */

type Mutable = Record<string, unknown>;
const g = globalThis as unknown as Mutable;

if (typeof g.DOMMatrix === "undefined") {
  class DOMMatrixShim {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;

    constructor(init?: number[] | string) {
      if (Array.isArray(init) && init.length >= 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init;
      }
    }

    multiply() {
      return this;
    }
    translate() {
      return this;
    }
    scale() {
      return this;
    }
    inverse() {
      return this;
    }
    transformPoint(p?: { x?: number; y?: number }) {
      return { x: p?.x ?? 0, y: p?.y ?? 0, z: 0, w: 1 };
    }
    toString() {
      return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`;
    }
  }
  g.DOMMatrix = DOMMatrixShim;
}

if (typeof g.Path2D === "undefined") {
  class Path2DShim {
    addPath() {}
    closePath() {}
    moveTo() {}
    lineTo() {}
    bezierCurveTo() {}
    quadraticCurveTo() {}
    arc() {}
    arcTo() {}
    ellipse() {}
    rect() {}
  }
  g.Path2D = Path2DShim;
}

if (typeof g.ImageData === "undefined") {
  class ImageDataShim {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    constructor(width = 0, height = 0) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(Math.max(0, width * height * 4));
    }
  }
  g.ImageData = ImageDataShim;
}

export {};
