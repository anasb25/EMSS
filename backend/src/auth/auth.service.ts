import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

export interface AuthUserPayload {
  id: string;
  username: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUserPayload;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersService.findByUsername(
      loginDto.username.trim(),
    );

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated.');
    }

    const payload: AuthUserPayload = {
      id: user.id,
      username: user.username,
      role: user.role.name,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: payload,
    };
  }

  async validateUser(userId: string): Promise<AuthUserPayload | null> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      return null;
    }

    if (!user.isActive) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role.name,
    };
  }
}
