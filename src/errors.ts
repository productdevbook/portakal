/** Base error class for portakal */
export class PortakalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortakalError";
  }
}

/** Thrown when label configuration is invalid */
export class InvalidConfigError extends PortakalError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidConfigError";
  }
}

/** Thrown when an unsupported feature is used for a target language */
export class UnsupportedFeatureError extends PortakalError {
  constructor(language: string, feature: string) {
    super(`${language} does not support: ${feature}`);
    this.name = "UnsupportedFeatureError";
  }
}
