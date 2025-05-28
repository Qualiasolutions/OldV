import { UserFullResponse } from 'types/users';

type UserState = {
  data: {
    user: UserFullResponse | null;
    isLoadingUser: boolean;
  };
};

export { UserState };
