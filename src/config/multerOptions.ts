import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import * as path from 'path';
import e from 'express';
import { HttpException, HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export const multerOptions: MulterOptions = {
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter(
    req: any,
    file: {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    },
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) {
    if (file.mimetype.match(/\/(jpg|jpeg|png|text)$/)) {
      callback(null, true);
    } else {
      callback(
        new HttpException('unsupported file type', HttpStatus.BAD_REQUEST),
        false,
      );
    }
  },
  storage: diskStorage({
    destination: './upload',
    filename(
      req: e.Request,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void,
    ) {
      callback(null, createFileName(file.originalname));
    },
  }),
};
function createFileName(originalname: string) {
  const date = new Date();
  const dateFormat = date.toISOString().slice(0, 10);
  return dateFormat + '-' + uuidv4() + '-' + originalname;
}
