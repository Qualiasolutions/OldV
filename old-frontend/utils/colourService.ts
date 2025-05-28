import { UserFullResponse } from 'types/users';

export const colourService = {
  getMemberColourByIdFromUserDetails(id: number, user: UserFullResponse) {
    const colour = user.family.users.find((x) => x.id === id)?.member_colour;
    return colour || '';
  }
};
