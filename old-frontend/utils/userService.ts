import { UserFullResponse, UserResponse } from 'types/users';

export const userService = {
  getUserByIdFromUserFullDetails(
    id: number,
    user: UserFullResponse
  ): UserResponse {
    const userDetails = user.family.users.find((x) => x.id === id);
    if (userDetails) return userDetails;
    throw Error('User cannot be found in family');
  }
};
