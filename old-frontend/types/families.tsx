import { UserResponse } from './users';

export type UpdateFamilyRequest = {
  familyId: number;
  formData?: FormData;
};

export type FamilyResponse = {
  id: number;
  users: UserResponse[];
  image: string;
  presigned_image_url: string;
};
