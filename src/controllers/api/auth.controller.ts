import { Body, Controller, HttpException, HttpStatus, Post, Put, Req } from "@nestjs/common";
import { LoginAdministratorDto } from "src/dtos/administrator/login.administrator.dto";
import { ApiResponse } from "src/misc/api.response.class";
import { AdministratorService } from "src/services/administrator/administrator.service";
import * as crypto from "crypto";
import { LoginInfoDto } from "src/dtos/auth/login.info.dto";
import * as jwt from "jsonwebtoken";
import { JwtDataDto } from "src/dtos/auth/jwt.data.dto";
import { Request } from "express";
import { jwtSecret } from "config/jwt.secret";
import { UserService } from "src/services/user/user.service";
import { UserRegisterationDto } from "src/dtos/user/user.registeration.dto";
import { LoginUserDto } from "src/dtos/user/login.user.dto";
import { JwtRefreshDataDto } from "src/dtos/auth/jwt.refresh.dto";
import { UserRefreshToken } from "src/dtos/auth/user.refresh.token.dto";
import { AdministratorRefreshToken } from "src/dtos/auth/administrator.refresh.token.dto";

@Controller('auth')
export class AuthController {
    constructor
    (public administratorService : AdministratorService,
     public userService: UserService) {}

    @Post('administrator/login')
    async doAdministratorLogin(@Body() data: LoginAdministratorDto, @Req() req: Request): Promise<ApiResponse | LoginInfoDto> {
        const administrator = await this.administratorService.getByUsername(data.username);

        if (!administrator) {
            return new Promise(resolve => resolve(new ApiResponse('error', -3001)));
        }

        const passwordHash = crypto.createHash('sha512');
        passwordHash.update(data.password);
        const passwordHashString = passwordHash.digest('hex').toUpperCase();

        if (administrator.passwordHash !== passwordHashString) {
            return new Promise(resolve => resolve(new ApiResponse('error', -3002)))
        }

        const jwtData = new JwtDataDto()
        jwtData.role  = 'administrator';
        jwtData.id = administrator.administratorId;
        jwtData.identity = administrator.username;
        jwtData.exp = this.getDatePlus(60 * 5);
        jwtData.ip = req.ip.toString();
        jwtData.ua = req.headers["user-agent"]

        let token: string = jwt.sign(jwtData.toPlaneObject(), jwtSecret)

        const responseObject = new LoginInfoDto(
            administrator.administratorId,
            administrator.username,
            token,
            "",
            ""    
        );

        return new Promise(resolve => resolve(responseObject));

    }

    @Post('administrator/refresh')
    async administratorTokenRefresh(@Req() req: Request, @Body() data: AdministratorRefreshToken) {
        const administratorToken = await this.administratorService.getAdministratorToken(data.token);

        if (!administratorToken) {
            return new ApiResponse('error', -1101, 'No such refresh token!');
        }

        if (administratorToken.isValid === 0) {
            return new ApiResponse('error', -1102, 'The token is not longer valid!');
        }

        const sada = new Date();
        const datumIsteka = new Date(administratorToken.expiresAt.replace(' ', 'T') + 'Z');

        if (datumIsteka.getTime() < sada.getTime()) {
            return new ApiResponse('error', -1103, 'The token has expired!')
        }

        let jwtRefreshData: JwtRefreshDataDto;
        
        try { 
            jwtRefreshData = jwt.verify(data.token, jwtSecret); 
         }catch (ext) {
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
         }

         if (!jwtRefreshData) {
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }

        if (jwtRefreshData.ip !== req.ip) {
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }

        if (jwtRefreshData.ua !== req.headers["user-agent"]) {
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }

        const jwtData = new JwtDataDto()
        jwtData.role  = jwtRefreshData.role;
        jwtData.id = jwtRefreshData.id;
        jwtData.identity = jwtRefreshData.identity;    
        jwtData.exp = this.getDatePlus(60 * 5);
        jwtData.ip = jwtRefreshData.ip;
        jwtData.ua = jwtRefreshData.ua

        let token: string = jwt.sign(jwtData.toPlaneObject(), jwtSecret);

        const responseObject = new LoginInfoDto(
            jwtData.id,
            jwtData.identity,
            token,
            data.token,
            this.getIsoDate(jwtRefreshData.exp)
        );

        return responseObject;
    }

    @Put('user/register')
    async userRegister(@Body() data: UserRegisterationDto) {
        return await this.userService.register(data);
    }

    @Post('user/login')
    async doAUserLogin(@Body() data: LoginUserDto, @Req() req: Request): Promise<ApiResponse | LoginInfoDto> {
        const user = await this.userService.getByEmail(data.email);

        if (!user) {
            return new Promise(resolve => resolve(new ApiResponse('error', -3001)));
        }

        const passwordHash = crypto.createHash('sha512');
        passwordHash.update(data.password);
        const passwordHashString = passwordHash.digest('hex').toUpperCase();

        if (user.passwordHash !== passwordHashString) {
            return new Promise(resolve => resolve(new ApiResponse('error', -3002)))
        }

        const jwtData = new JwtDataDto()
        jwtData.role  = 'user';
        jwtData.id = user.userId;
        jwtData.identity = user.email;     
        jwtData.exp = this.getDatePlus(60 * 5);
        jwtData.ip = req.ip.toString();
        jwtData.ua = req.headers["user-agent"]

        let token: string = jwt.sign(jwtData.toPlaneObject(), jwtSecret);

        const jwtRefreshData = new JwtRefreshDataDto();
        jwtRefreshData.role = jwtData.role;
        jwtRefreshData.id = jwtData.id;
        jwtRefreshData.identity = jwtData.identity;
        jwtRefreshData.exp = this.getDatePlus(60 * 60 * 24 * 30);
        jwtRefreshData.ip = jwtData.ip;
        jwtRefreshData.ua = jwtData.ua;

        let refreshToken: string = jwt.sign(jwtRefreshData.toPlaneObject(), jwtSecret)

        const responseObject = new LoginInfoDto(
            user.userId,
            user.email,
            token,
            refreshToken,
            this.getIsoDate(jwtRefreshData.exp)
        );

        await this.userService.addToken(user.userId, refreshToken, this.getDatabaseDateFormat(this.getIsoDate(jwtRefreshData.exp)));

        return new Promise(resolve => resolve(responseObject));

    }

    @Post('user/refresh')
    async userTokenRefresh(@Req() req: Request, @Body() data: UserRefreshToken): Promise<LoginInfoDto | ApiResponse> {
        const userToken = await this.userService.getUserToken(data.token);

        if (!userToken) {
            return new ApiResponse('error', -10002, 'No such refresh token!');
        }

        if (userToken.isValid === 0) {
            return new ApiResponse('error', -10003, 'The token is no longer valid!');
        }

        const sada = new Date();
        const datumIsteka = new Date(userToken.expiresAt.replace(' ', 'T') + 'Z');

        if (datumIsteka.getTime() < sada.getTime()) {
            return new ApiResponse('error', -10004, 'The token has expaired!');
        }

        let jwtRefreshData: JwtRefreshDataDto;
        
        try { 
            jwtRefreshData = jwt.verify(data.token, jwtSecret); 
         }catch (ext) {
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
         }

         if (!jwtRefreshData) {
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }

        if (jwtRefreshData.ip !== req.ip) {
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }

        if (jwtRefreshData.ua !== req.headers["user-agent"]) {
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }

        const jwtData = new JwtDataDto()
        jwtData.role  = jwtRefreshData.role;
        jwtData.id = jwtRefreshData.id;
        jwtData.identity = jwtRefreshData.identity;    
        jwtData.exp = this.getDatePlus(60 * 5);
        jwtData.ip = jwtRefreshData.ip;
        jwtData.ua = jwtRefreshData.ua

        let token: string = jwt.sign(jwtData.toPlaneObject(), jwtSecret);

        const responseObject = new LoginInfoDto(
            jwtData.id,
            jwtData.identity,
            token,
            data.token,
            this.getIsoDate(jwtRefreshData.exp)
        );

        return responseObject;
    }

    private getDatePlus(numberOfSecunds: number): number {
        return new Date().getTime() / 1000 + numberOfSecunds;
    }

    private getIsoDate(timestamp: number): string {
        const date = new Date();
        date.setTime(timestamp * 1000);
        return date.toISOString();
    }

    private getDatabaseDateFormat(isoFormat: string): string {
        return isoFormat.substring(0, 19).replace('T', ' ');
    }
}