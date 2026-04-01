import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('register')
  async register(
    @Body() body: { username: string; email: string; password: string },
  ) {
    const user = await this.usersService.create(body.username, body.email, body.password);
    const { password, ...result } = user;
    return result;
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    const payload = { sub: user.id, email: user.email, username: user.username };
    return {
      access_token: this.authService.generateToken(payload),
      id: user.id,
      username: user.username,
      email: user.email,
    };
  }
}
