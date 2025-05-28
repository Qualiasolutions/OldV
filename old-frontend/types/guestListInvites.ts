import { EntityResponseType } from './entities';

export type GuestListInvite = {
  user: number;
  entity: number;
  phone_number: string;
  email: string;
  name: string;
  accepted: boolean;
  rejected: boolean;
  maybe: boolean;
  sent: boolean;
  id: number;
};

export type GuestListInviteeInvite = {
  id: number;
  accepted: boolean;
  rejected: boolean;
  maybe: boolean;
  entity: EntityResponseType;
};

export type CreateGuestListInviteRequest = Partial<GuestListInvite> & {
  entity: number;
};
