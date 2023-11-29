import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Administrator } from "src/entities/administrator.entity";
import { AddAdministratorDto } from "src/dtos/administrator/add.administrator.dto";
import { Repository } from "typeorm";
import * as crypto from "crypto";
import { EditAdministratorDto } from "src/dtos/administrator/edit.administrator.dto";
import { AdministratorToken } from "src/entities/administrator-token.entity";
import { ApiResponse } from "src/misc/api.response.class";

@Injectable()
export class AdministratorService {
    constructor(
        @InjectRepository(Administrator) private readonly administrator : Repository<Administrator>,
        @InjectRepository(AdministratorToken) private readonly administratorToken : Repository<AdministratorToken>) {}

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

        async addToken(administratorId: number, token: string, expiresAt: string) {
            const administratorToken = new AdministratorToken();
            administratorToken.administratorId = administratorId;
            administratorToken.token = token;
            administratorToken.expiresAt = expiresAt;

            return await this.administratorToken.save(administratorToken);
        }

        async getAdministratorToken(token: string): Promise <AdministratorToken> {
            return await this.administratorToken.findOne( {where: {token: token}});
        }

        async invalidateToken(token: string): Promise <AdministratorToken | ApiResponse> {
            const administratorToken = await this.administratorToken.findOne({where: {token: token}});
            
            if (!administratorToken) {
                return new ApiResponse('error', -1101, 'No such refresh token!');
            }

            administratorToken.isValid = 0;

            await this.administratorToken.save(administratorToken);

            return this.getAdministratorToken(token);
        }

        async invalidateAdministratorToken(administratorId: number): Promise <(AdministratorToken | ApiResponse)[] >{
            const administratorTokens = await this.administratorToken.find({
                where: {
                    administratorId: administratorId
                }
            });
            
            let results = []

            for (const administratorToken of administratorTokens) {
                results.push(this.invalidateToken(administratorToken.token))
            }

            return results;
        }
}