export declare class Dependency {
    getKey(): Promise<string>;
    initialize(): Promise<void>;
    finish(): Promise<void>;
    isSingleAccess(): Promise<boolean>;
}
