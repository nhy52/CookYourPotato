import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Potato } from './potato.entity';
import { PotatoService } from './potato.service';
import { PotatoController } from './potato.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Potato]), AuthModule],
  providers: [PotatoService],
  controllers: [PotatoController],
})
export class PotatoModule {}
