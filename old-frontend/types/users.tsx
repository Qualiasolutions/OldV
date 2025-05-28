import { EntityTypeName } from './entities';
import { FamilyResponse } from './families';

export type AuthDetails = {
  username: string;
  email: string;
  user_id: number;
};

export type CreateUserInviteRequest = {
  family: number | null;
  invitee: number;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  email?: string;
  dob?: string;
  member_colour?: string;
};

export type UpdateUserInviteRequest = {
  id: number;
  family?: number;
  invitee?: number;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  dob?: string;
  member_colour?: string;
  rejected?: boolean;
};

export type UserInviteResponse = {
  id: number;
  family: number;
  invitee: {
    id: number;
    first_name: string;
    last_name: string;
  };
  first_name: string;
  last_name: string;
  phone_number: string | null;
  email: string | null;
  dob: string;
  member_colour: string;
  accepted: boolean;
  rejected: boolean;
};

export type FriendshipRequest = {
  creator: number;
  friend: number;
};

export type FriendshipResponse = {
  creator: number;
  friend: number;
  created_at: string;
  id: number;
};

export type FriendshipDeleteRequest = {
  id: number;
};

export type UpdateUserRequest = {
  user_id: number;
  family?: number;
  username?: string;
  phone_number?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  dob?: string;
  member_colour?: string;
  has_done_setup?: boolean;
  is_premium?: boolean;
};

export type SecureUpdateUserRequest = {
  user_id: number;
  old_password?: string;
  reset_password_code?: string;
  password?: string;
};

export type FormUpdateUserRequest = {
  userId: number;
  formData?: FormData;
};

export type UserResponse = {
  id: number;
  username: string;
  family: number;
  last_login: string;
  is_superuser: boolean;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  member_colour: string;
  dob: string;
  has_done_setup: boolean;
  profile_image: string;
  presigned_profile_image_url: string;
};

export type UserFullResponse = {
  id: number;
  family: FamilyResponse;
  friends: UserResponse[];
  last_login: string;
  is_superuser: boolean;
  is_premium: boolean;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  member_colour: string;
  dob: string;
  has_done_setup: boolean;
  profile_image: string;
  presigned_profile_image_url: string;
};

export type UserMinimalResponse = {
  id: number;
  phone_number: string;
  email: string;
  member_colour: string;
};

export type CategorySetupCompletion = {
  id: number;
  category: number;
  user: number;
};

export type EntityTypeSetupCompletion = {
  id: number;
  entity_type: EntityTypeName;
  user: number;
};

export type ReferencesSetupCompletion = {
  id: number;
  user: number;
};

export type TagSetupCompletion = {
  id: number;
  tag_name: string;
  user: number;
};

export type LinkListSetupCompletion = {
  id: number;
  list_name: string;
  user: number;
};

export type LastActivityView = {
  id: number;
  timestamp: string;
  user: number;
};
