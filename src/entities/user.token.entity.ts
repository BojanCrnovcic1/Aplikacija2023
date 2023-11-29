import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
  } from "typeorm";
  import * as Validator from "class-validator";
  
  @Entity("user_token")
  export class UserToken {
    @PrimaryGeneratedColumn({
      type: "int",
      name: "user_token_id",
      unsigned: true,
    })
    userTokenId: number;
  
    @Column({ type: "int",  name: "user_id", unsigned: true })
    userId: number;

    @Column({ type: "timestamp",  name: "created_at", default: () => "'now()'" })
    createdAt: Date;

    @Validator.IsNotEmpty()
    @Validator.IsString()
    @Column({ type: "text" })
    token: string;

    @Column({ type: "datetime",  name: "expires_at" })
    expiresAt: string;

    @Validator.IsNotEmpty()
    @Validator.IsIn([ 0, 1 ])
    @Column({type: "tinyint",  name: "is_valid", default: 1 })
    isValid: number;
  }