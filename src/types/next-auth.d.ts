import { UserRole } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface User {
    username: string;
    role: UserRole;
    facilityId: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      username: string;
      role: UserRole;
      facilityId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: UserRole;
    facilityId: string | null;
  }
}
