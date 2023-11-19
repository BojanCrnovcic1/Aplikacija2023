import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Administrator } from "src/entities/administrator.entity";
import { AddAdministratorDto } from "src/dtos/administrator/add.administrator.dto";
import { Repository } from "typeorm";
import * as crypto from "crypto";
import { EditAdministratorDto } from "src/dtos/administrator/edit.administrator.dto";

@Injectable()
export class AdministratorService {
    constructor(
        @InjectRepository(Administrator) private readonly administrator : Repository<Administrator>) {}

        getAll(): Promise<Administrator[]> {
            return this.administrator.find();
        }

        async getByUsername(username: string): Promise<Administrator | null> {
            const admin = await this.administrator.findOne({where: {
                username : username } });

                if (admin) {
                    return admin;
                }
                  return null;             
        }

        getById(id: number): Promise<Administrator> {
            return this.administrator.findOne({where: {administratorId: id}})
        }

        add(data : AddAdministratorDto) {
            const passwordHash = crypto.createHash('sha512');
            passwordHash.update(data.password);
            const passwordHashString = passwordHash.digest('hex').toUpperCase();

            let newAdmin: Administrator = new Administrator();
            newAdmin.username = data.username;
            newAdmin.passwordHash = passwordHashString;

            return this.administrator.save(newAdmin)
        }

        async editById(id: number, data: EditAdministratorDto): Promise<Administrator> {
            let admin: Administrator = await this.administrator.findOne({where: {administratorId: id}})

            const passwordHash = crypto.createHash('sha512');
            passwordHash.update(data.password);
            const passwordHashString = passwordHash.digest('hex').toUpperCase();

            admin.passwordHash = passwordHashString;

            return this.administrator.save(admin)          
        }
}