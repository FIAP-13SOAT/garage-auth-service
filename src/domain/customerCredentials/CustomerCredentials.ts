import type { UUID } from '../../shared/types/UUID.js';

export interface CustomerCredentialsProps {
  id: UUID;
  customerId: UUID;
  cpfCnpj: string;
  email: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CustomerCredentials {
  readonly id: UUID;
  readonly customerId: UUID;
  readonly cpfCnpj: string;
  readonly email: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: CustomerCredentialsProps) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.cpfCnpj = props.cpfCnpj;
    this.email = props.email;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }
}
