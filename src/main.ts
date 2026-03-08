import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activación del Filtro de Excepciones Global
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Activación del Pipeline de Validación DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // El API Gateway se encarga de CORS y Cookies ahora.
  // El BFF solo responde a de peticiones de red interna (localhost)

  await app.listen(process.env.PORT ?? 3000);
  console.log('BFF Service listening on ' + (process.env.PORT ?? 3000));
}
bootstrap();