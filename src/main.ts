import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet, { contentSecurityPolicy, crossOriginOpenerPolicy } from "helmet";
import * as csurf from 'csurf';
import { PrismaClientExceptionFilter } from './filter/prisma-client-exception/prisma-client-exception.filter';
import * as cookieParser from "cookie-parser";
import { ConfigService } from "@nestjs/config";
import { json, urlencoded } from "express";
import * as bodyParser from "body-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<string>('server.port');
  // const allowCrossDomain = (req, res, next) => {
  //   res.header(`Access-Control-Allow-Origin`, `http://localhost:4200`);
  //   res.header(`Access-Control-Allow-Methods`, `GET,PUT,POST,DELETE`);
  //   next();
  // };

  app.enableCors({
    origin: "http://localhost:4200",
    methods: ['GET','PUT','POST','DELETE'],
    credentials: true,
    exposedHeaders: ['set-cookie'],
  });
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    },
    crossOriginOpenerPolicy: {
      policy: "same-origin-allow-popups"
    },
  }));
  app.use(cookieParser());
  // app.use(bodyParser.json())
  // app.use(bodyParser.urlencoded({extended: true}))
  // app.use(json());
  // app.use(urlencoded({extended: true}))

  // app.use(allowCrossDomain)
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
  // app.use("/", csurf({cookie:true}));
  // const { httpAdapter } = app.get(HttpAdapterHost);
  await app.listen(port);
  console.log(`port: ${port}`);
}
bootstrap();
