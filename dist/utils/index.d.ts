import { DataLayerFsApi } from '../DataLayer/DataLayer';
export interface CopyResourcesOptions {
    skipExisting?: boolean;
    exclude?: string[];
    include?: string[];
}
export declare const matchPathFilter: (fsPath: string, matchers: string[]) => boolean;
export declare const copyFs: (sourcePath: string, destinationPath: string, sourceFs: DataLayerFsApi, destinationFs: DataLayerFsApi, options?: CopyResourcesOptions) => Promise<void>;
