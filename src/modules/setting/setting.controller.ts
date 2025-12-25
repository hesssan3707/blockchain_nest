import { Body, Controller, Get, Put } from '@nestjs/common';
import { SettingService } from './setting.service';

@Controller('setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  async findAll() {
    const settings = await this.settingService.findAll();
    return {
      data: settings,
      message: 'Settings retrieved successfully',
      status: 200,
    };
  }

  @Put()
  async update(@Body() body: { key: string; value: any }) {
    const data = await this.settingService.update(body.key, body.value);
    return {
      data,
      message: 'Setting updated successfully',
      status: 200,
    };
  }
}
