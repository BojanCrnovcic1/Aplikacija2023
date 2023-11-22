import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { UserRegisterationDto } from "src/dtos/user/user.registeration.dto";
import { User } from "src/entities/user.entity";
import { ApiResponse } from "src/misc/api.response.class";
import { Repository } from "typeorm";
import * as crypto from "crypto";

@Injectable()
export class UserService extends TypeOrmCrudService<User> {
    constructor(
        @InjectRepository(User) private user: Repository<User>
    ) { super(user)}


async register(data: UserRegisterationDto): Promise <User | ApiResponse> {
    const passwordHash = crypto.createHash('sha512');
    passwordHash.update(data.password);
    const passwordHashString = passwordHash.digest('hex').toUpperCase();

    const newUser: User = new User();
    newUser.email = data.email;
    newUser.passwordHash = passwordHashString;
    newUser.forename = data.forname;
    newUser.surname = data.surname;
    newUser.phoneNumber = data.phoneNumber;
    newUser.postalAddress = data.postalAddress;

    try {
        const savedUser = await this.user.save(newUser);

        if (!savedUser) {
            throw new Error('');
        }
        else {
            return savedUser;
        }
    }catch (ex) {
        return new ApiResponse('error', -6001, 'Not created user.');
    }
}
}