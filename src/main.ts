import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { exec } from 'child_process';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  exec('npx prisma migrate deploy', (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao executar migrations: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Migrations: ${stdout}`);
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
