export class PromptGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromptGenerationError";
  }
}
