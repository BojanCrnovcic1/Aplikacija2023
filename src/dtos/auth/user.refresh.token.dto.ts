import * as Validator from "class-validator";

export class UserRefreshToken {
    @Validator.IsNotEmpty()
    @Validator.IsString()
    token: string;
}