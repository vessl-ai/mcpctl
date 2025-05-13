interface Container {
  register<T>(name: string, instance: T): void;
  get<T>(name: string): T;
  has(name: string): boolean;
}

class BaseContainer implements Container {
  private registry: Map<string, any>;

  constructor() {
    this.registry = new Map();
  }

  register<T>(name: string, instance: T): void {
    if (this.registry.has(name)) {
      throw new Error(`Already registered: ${name}`);
    }
    this.registry.set(name, instance);
  }

  get<T>(name: string): T {
    const instance = this.registry.get(name);
    if (!instance) {
      throw new Error(`Not registered: ${name}`);
    }
    return instance as T;
  }

  has(name: string): boolean {
    return this.registry.has(name);
  }
}

export { BaseContainer, Container };
