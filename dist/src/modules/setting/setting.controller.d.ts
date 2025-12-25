import { SettingService } from './setting.service';
export declare class SettingController {
    private readonly settingService;
    constructor(settingService: SettingService);
    findAll(): Promise<{
        data: import("./setting.entity").Setting[];
        message: string;
        status: number;
    }>;
    update(body: {
        key: string;
        value: any;
    }): Promise<{
        data: import("./setting.entity").Setting;
        message: string;
        status: number;
    }>;
}
