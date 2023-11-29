import * as Validator from "class-validator";

export class AdministratorRefreshToken {
    @Validator.IsNotEmpty()
    @Validator.IsString()
    token: string;
}