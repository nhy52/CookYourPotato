import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Potato } from './potato.entity';

const DEFAULT_COUNTS = {
  nightGuard: 0, tavern: 0, farm: 0, mine: 0, jog: 0,
  library: 0, etiquette: 0, arts: 0, church: 0, street: 0, totalWork: 0,
};

@Injectable()
export class PotatoService {
  constructor(
    @InjectRepository(Potato)
    private potatoRepository: Repository<Potato>,
  ) {}

  async findByUserId(userId: number): Promise<Potato | null> {
    return this.potatoRepository.findOne({ where: { userId } });
  }

  async create(userId: number, name: string, birthday: string): Promise<Potato> {
    const potato = this.potatoRepository.create({
      userId,
      name,
      birthday,
      counts: { ...DEFAULT_COUNTS },
    });
    return this.potatoRepository.save(potato);
  }

  async update(userId: number, data: Partial<Potato>): Promise<Potato> {
    const potato = await this.findByUserId(userId);
    if (!potato) throw new NotFoundException('감자를 찾을 수 없어요.');
    Object.assign(potato, data);
    return this.potatoRepository.save(potato);
  }
}
