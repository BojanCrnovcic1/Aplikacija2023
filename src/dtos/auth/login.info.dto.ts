export class LoginInfoDto {
    id: number;
    identity: string;
    token: string;
    refreshToken: string;
    refreshTokenExpariesAt: string;

    constructor(id: number, identity: string, jwt: string, refreshToken: string, refreshTokenExpsAt: string) {
        this.id = id;
        this.identity = identity;
        this.token = jwt;
        this.refreshToken = refreshToken;
        this.refreshTokenExpariesAt = refreshTokenExpsAt;
    }
}