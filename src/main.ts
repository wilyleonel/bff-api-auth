import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use require syntax
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());

  console.log('Starting server on http://localhost:3001');
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });
  console.log('CORS enabled for http://localhost:5173');

  await app.listen(3001);
  console.log('SERVER UP ON 3001');
}
bootstrap();