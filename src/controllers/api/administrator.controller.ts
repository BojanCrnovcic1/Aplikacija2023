import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { Administrator } from "src/entities/administrator.entity";
import { AddAdministratorDto } from "src/dtos/administrator/add.administrator.dto";
import { EditAdministratorDto } from "src/dtos/administrator/edit.administrator.dto";
import { ApiResponse } from "src/misc/api.response.class";
import { AdministratorService } from "src/services/administrator/administrator.service";

@Controller('api/administrator')
export class AdministratorController {
    constructor(private administratorService : AdministratorService) {}

    @Get()
    getAllAdmins(): Promise<Administrator[]> {
    return this.administratorService.getAll();
  }

   @Get(':id')
   getById(@Param('id')administratorId: number): Promise<Administrator> {
    return this.administratorService.getById(administratorId);
   }

   @Put()
   add(@Body() data: AddAdministratorDto): Promise<Administrator> {
    return this.administratorService.add(data)
   }

   @Post(':id') 
   edit(@Param('id') id: number, @Body()data: EditAdministratorDto): Promise<Administrator> {
    return this.administratorService.editById(id,data);
   }

}