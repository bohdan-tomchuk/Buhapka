import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: ts-node src/scripts/create-user.ts <email> <password>');
    process.exit(1);
  }

  try {
    const user = await usersService.create(email, password);
    console.log('✅ User created successfully:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Created: ${user.created_at}`);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  }

  await app.close();
}

bootstrap();
