import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsController } from './products.controller';
import { CompanyController } from './company.controller';
import { ProductsService } from './products.service';
import { CompanyService } from './company.service';
import { LoggerMiddleware } from './logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PRODUCTS_SERVICE_URL: Joi.string().uri().required(),
        COMPANY_SERVICE_URL: Joi.string().uri().required(),
        PORT: Joi.number().default(3000),
      }),
    }),
    HttpModule,
  ],
  controllers: [AppController, ProductsController, CompanyController],
  providers: [AppService, ProductsService, CompanyService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
