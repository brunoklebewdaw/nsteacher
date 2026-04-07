export interface SessionUser {
  id: string;
  role: 'admin' | 'teacher';
  name: string;
  email: string;
}

export interface Session {
  user: SessionUser;
  expires: string;
}