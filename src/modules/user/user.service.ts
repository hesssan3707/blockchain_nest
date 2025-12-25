import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hashPasswordDjangoPbkdf2Sha256 } from '../../common/security/password';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    if (!dto.identifier) {
      throw new BadRequestException('identifier is required');
    }
    const identifier = dto.identifier.trim();
    if (!identifier) throw new BadRequestException('identifier is required');

    const existing = await this.userRepo.findOne({ where: { identifier } });
    if (existing) throw new BadRequestException('user already exists');

    const user = this.userRepo.create({
      identifier,
      priority: dto.priority ?? 4,
      passwordHash: dto.password
        ? hashPasswordDjangoPbkdf2Sha256(dto.password)
        : null,
      isStaff: false,
      isSuperuser: false,
      isActive: true,
    });
    return this.userRepo.save(user);
  }

  async getByIdentifier(identifier: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { identifier } });
  }
}
