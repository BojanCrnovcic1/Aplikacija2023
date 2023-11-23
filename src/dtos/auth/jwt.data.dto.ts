export class JwtDataDto {
    role: "administrator" | "user";
    id: number;
    identity: string;
    exp: number;
    ip: string;
    ua: string;

    toPlaneObject()  {
        return {
            role: this.role,
            id : this.id,
            identity: this.identity,
            exp : this.exp,
            ip : this.ip,
            ua : this.ua
        }
    }
}