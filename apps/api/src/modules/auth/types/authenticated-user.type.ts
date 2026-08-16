import { AppRole } from "./role.type";

export interface AuthenticatedUser {
  id: string;
  sessionId: string;
  email: string;
  roles: AppRole[];
}