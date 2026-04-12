import type { UUID } from '../../shared/types/UUID.js';
import { UserRole } from './UserRole.js';

export interface UserProps {
  id: UUID;
  fullname: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt?: Date;
}

export class User {
  readonly id: UUID;
  fullname: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  readonly createdAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.fullname = props.fullname;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.role = props.role;
    this.createdAt = props.createdAt ?? new Date();
  }

  update(data: Partial<Pick<UserProps, 'fullname' | 'email' | 'role'>>): void {
    if (data.fullname !== undefined) this.fullname = data.fullname;
    if (data.email !== undefined) this.email = data.email;
    if (data.role !== undefined) this.role = data.role;
  }
}
