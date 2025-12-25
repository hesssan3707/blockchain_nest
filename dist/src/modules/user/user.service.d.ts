import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UserService {
    private readonly userRepo;
    constructor(userRepo: Repository<User>);
    createUser(dto: CreateUserDto): Promise<User>;
    getByIdentifier(identifier: string): Promise<User | null>;
}
