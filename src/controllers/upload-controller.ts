import { Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { S3Service } from '../services/S3Service';
import { Public } from '../decorators/public.decorator';

@Controller("upload")
export class UploadController {
  constructor(private readonly s3Service: S3Service) {}

  @Public()
  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const url = await this.s3Service.uploadImage(file);
    return { url };
  }
}
