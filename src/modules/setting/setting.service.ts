import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './setting.entity';

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepo: Repository<Setting>,
  ) {}

  async get(key: string): Promise<string | null> {
    const setting = await this.settingRepo.findOne({ where: { key } });
    return setting?.value ?? null;
  }

  async findAll(): Promise<Setting[]> {
    return this.settingRepo.find();
  }

  async update(key: string, value: any): Promise<Setting> {
    let setting = await this.settingRepo.findOne({ where: { key } });
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    if (setting) {
      setting.value = stringValue;
    } else {
      setting = this.settingRepo.create({ key, value: stringValue });
    }
    return this.settingRepo.save(setting);
  }
}
