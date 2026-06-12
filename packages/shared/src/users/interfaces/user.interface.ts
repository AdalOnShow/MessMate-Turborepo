import { createUserRequest } from '../dto/create-user.request';

export interface User extends createUserRequest {
  id: string;
}
