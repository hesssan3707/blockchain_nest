import { Repository } from 'typeorm';
import { Setting } from './setting.entity';
export declare class SettingService {
    private readonly settingRepo;
    constructor(settingRepo: Repository<Setting>);
    get(key: string): Promise<string | null>;
    findAll(): Promise<Setting[]>;
    update(key: string, value: any): Promise<Setting>;
}
