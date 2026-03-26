import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(username: string, email: string, password: string): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: [{ email }, { username }],
    });
    if (existing) {
      throw new ConflictException('이미 사용 중인 이메일 또는 사용자명입니다.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({ username, email, password: hashedPassword });
    return this.usersRepository.save(user);
  }

  async update(
    id: number,
    updateData: { username?: string; email?: string; password?: string },
  ): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }

  async delete(id: number): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    await this.usersRepository.remove(user);
  }
}
