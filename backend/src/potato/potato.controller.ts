import {
  Controller, Get, Post, Put,
  Body, Headers, UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PotatoService } from './potato.service';

@Controller('potato')
export class PotatoController {
  constructor(
    private potatoService: PotatoService,
    private authService: AuthService,
  ) {}

  private getUserId(auth: string): number {
    try {
      const token = auth?.replace('Bearer ', '');
      const payload = this.authService.verifyToken(token) as { sub: number };
      return payload.sub;
    } catch {
      throw new UnauthorizedException('인증이 필요해요.');
    }
  }

  @Get()
  async get(@Headers('authorization') auth: string) {
    const userId = this.getUserId(auth);
    return this.potatoService.findByUserId(userId);
  }

  @Post()
  async create(
    @Headers('authorization') auth: string,
    @Body() body: { name: string; birthday: string },
  ) {
    const userId = this.getUserId(auth);
    return this.potatoService.create(userId, body.name, body.birthday);
  }

  @Put()
  async update(
    @Headers('authorization') auth: string,
    @Body() body: any,
  ) {
    const userId = this.getUserId(auth);
    // userId는 body에서 받지 않고 토큰에서 추출
    const { userId: _u, id: _i, createdAt: _c, ...data } = body;
    return this.potatoService.update(userId, data);
  }
}
