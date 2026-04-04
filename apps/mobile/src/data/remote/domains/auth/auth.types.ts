export interface CheckEmailRequest {
  email: string;
}

export interface CheckEmailResponse {
  exists: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
}

export interface RegisterResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
}
