import type { User } from '../../../../domain/user/User.js';

export interface UserResponse {
  id: string;
  fullname: string;
  email: string;
  role: string;
  createdAt: string;
}

export class UserPresenter {
  toResponse(user: User): UserResponse {
    return {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }

  toList(users: User[]): UserResponse[] {
    return users.map((u) => this.toResponse(u));
  }
}
