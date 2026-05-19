export interface Driver {
  person_id: string;
  name?: string;
  licenseNumber?: string;
  licenseExpiration?: string;
  status?: string;
  isActive?: boolean;
  person?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export type DriverStatus = "active" | "inactive" | "suspended";
