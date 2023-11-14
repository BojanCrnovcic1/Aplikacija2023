import { Controller, Get } from '@nestjs/common';
import { Administrator } from 'entities/administrator.entity';
import { AdministratorService } from '../services/administrator/administrator.service';


@Controller()
export class AppController {
  constructor(private adminService : AdministratorService) {}

  @Get()
  getHello(): string {
    return "heloo";
  }

  
}
