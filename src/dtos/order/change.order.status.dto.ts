import * as Validator from "class-validator"

export class ChangeOrderStatusDto {
    @Validator.IsNotEmpty()
    @Validator.IsString()
    @Validator.IsIn(["rejected", "accepted", "shipped", "pedding"])
    status: "rejected" | "accepted" | "shipped" | "pedding"; 
}