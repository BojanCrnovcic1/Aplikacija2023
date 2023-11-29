import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
  } from "typeorm";
  import * as Validator from "class-validator";
  
  @Entity("administrator_token")
  export class AdministratorToken {
    @PrimaryGeneratedColumn({
      type: "int",
      name: "administrator_token_id",
      unsigned: true,
    })
    administratorTokenId: number;
  
    @Column({ type: "int",  name: "administrator_id", unsigned: true })
    administratorId: number;

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