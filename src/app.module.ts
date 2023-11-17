import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './controllers/app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfiguration } from 'config/database.configuration';
import { Administrator } from 'entities/administrator.entity';
import { AdministratorService } from './services/administrator/administrator.service';
import { ArticleFeature } from 'entities/article-feature.entity';
import { ArticlePrice } from 'entities/article-price.entity';
import { Article } from 'entities/article.entity';
import { CartArticle } from 'entities/cart-article.entity';
import { Cart } from 'entities/cart.entity';
import { Category } from 'entities/category.entity';
import { Feature } from 'entities/feature.entity';
import { Order } from 'entities/order.entity';
import { Photo } from 'entities/photo.entity';
import { User } from 'entities/user.entity';
import { AdministratorController } from './controllers/api/administrator.controller';
import { CategoryService } from './services/category/category.service';
import { CategoryController } from './controllers/api/category.controller';
import { ArticleController } from './controllers/api/article.controller';
import { ArticleService } from './services/article/article.service';
import { AuthController } from './controllers/api/auth.controller';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { PhotoService } from './services/photo/photo.service';

@Module({
  imports: [
   TypeOrmModule.forRoot({
    type: 'mysql',
    host: DatabaseConfiguration.hostname,
    port: 3306,
    username: DatabaseConfiguration.username,
    password: DatabaseConfiguration.password,
    database: DatabaseConfiguration.database,
    entities: [
      Administrator,
      ArticleFeature,
      ArticlePrice,
      Article,
      CartArticle,
      Cart,
      Category,
      Feature,
      Order,
      Photo,
      User
    ]
   }),
   TypeOrmModule.forFeature([
    Administrator,
    Category,
    Article,
    ArticlePrice,
    ArticleFeature,
    Photo,
  ])
  ],
  controllers: [
    AppController,
    AdministratorController,
    CategoryController,
    ArticleController,
    AuthController,
  ],
  providers: [
    AdministratorService, 
    CategoryService,
    ArticleService,
    PhotoService
  ],
  exports: [AdministratorService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(AuthMiddleware)
    .exclude('auth/*')
    .forRoutes('api/*')
  }
}
