import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';

// 가짜 Repository (실제 DB 연결 없이 동작)
const mockUsersRepository = {
  findOne: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User), // @InjectRepository(User) 대신 주입
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // 각 테스트 후 mock 초기화
  });

  describe('findByEmail', () => {
    it('존재하는 이메일이면 User를 반환한다', async () => {
      // given: DB에 유저가 있다고 가정
      const mockUser: Partial<User> = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        password: 'hashed_password',
      };
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      // when
      const result = await service.findByEmail('test@test.com');

      // then
      expect(result).toEqual(mockUser);
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      });
    });

    it('존재하지 않는 이메일이면 null을 반환한다', async () => {
      // given: DB에 유저가 없다고 가정
      mockUsersRepository.findOne.mockResolvedValue(null);

      // when
      const result = await service.findByEmail('없는@test.com');

      // then
      expect(result).toBeNull();
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { email: '없는@test.com' },
      });
    });
  });
});
