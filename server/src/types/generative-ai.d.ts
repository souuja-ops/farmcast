declare module '@google/generative-ai' {
  // Minimal ambient type declarations to allow compilation.
  // We only declare the shapes used by the project.
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(opts: { model: string; generationConfig?: Record<string, unknown> }): any;
  }

  export {}; // make this a module
}
