import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as csurf from 'csurf';
import { PrismaClientExceptionFilter } from './filter/prisma-client-exception/prisma-client-exception.filter';
import * as cookieParser from "cookie-parser";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<string>('server.port');
  app.enableCors({
    origin: "http://localhost:4200",
    credentials: true
  });
  app.use(helmet());
  app.use(cookieParser());
  // app.use(
  //   helmet.contentSecurityPolicy({
  //     useDefaults: false,
  //     directives: {
  //       'script-src': ['self'],
  //       'img-src': ['self'],
  //       'base-uri': ['/'],
  //     },
  //   }),
  // );
  // app.use(csurf());
  // const { httpAdapter } = app.get(HttpAdapterHost);
  await app.listen(port);
  console.log(`port: ${port}`);
}
bootstrap();
