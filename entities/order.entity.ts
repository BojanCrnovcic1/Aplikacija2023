import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Cart } from "./cart.entity";

@Index("uq_order_cart_id", ["cartId"], { unique: true })
@Entity("order")
export class Order {
  @PrimaryGeneratedColumn({ type: "int", name: "order_id", unsigned: true })
  orderId: number;

  @Column({type: "timestamp",  name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("int", {
    name: "cart_id",
    unique: true,
    unsigned: true,
    default: () => "'0'",
  })
  cartId: number;

  @Column("enum", {
    name: "status",
    enum: ["rejected", "accepted", "shipped", "pedding"],
    default: () => "'pedding'",
  })
  status: "rejected" | "accepted" | "shipped" | "pedding";

  @OneToOne(() => Cart, (cart) => cart.order, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "cart_id", referencedColumnName: "cartId" }])
  cart: Cart;
}
