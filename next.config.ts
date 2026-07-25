import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * pdf-parse pulls in pdfjs-dist, which touches DOM globals (DOMMatrix) at
   * module evaluation and resolves its worker with a dynamic import. When
   * Turbopack bundles it for the server both break: the module throws
   * "ReferenceError: DOMMatrix is not defined" before our route handler runs,
   * so the try/catch in the handler never fires and the request 500s.
   *
   * Marking them external leaves them in node_modules to be required by plain
   * Node at runtime, where the legacy build works as intended.
   */
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
