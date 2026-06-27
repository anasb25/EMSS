import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum RoleName {
  USER = 'User',
  ADMIN = 'Admin',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: RoleName;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
