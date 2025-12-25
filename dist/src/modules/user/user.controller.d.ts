import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    create(dto: CreateUserDto): Promise<{
        data: {
            id: number;
            identifier: string;
            priority: number;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        message: string;
        status: number;
    }>;
}
