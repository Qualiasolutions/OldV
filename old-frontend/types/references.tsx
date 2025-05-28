export type ReferenceType =
  | 'NAME'
  | 'ACCOUNT_NUMBER'
  | 'USERNAME'
  | 'PASSWORD'
  | 'WEBSITE'
  | 'NOTE'
  | 'ADDRESS'
  | 'PHONE_NUMBER'
  | 'DATE'
  | 'OTHER';

export type Reference = {
  id: number;
  name: string;
  value: string;
  group: number;
  type: ReferenceType;
  created_by: number;
  created_at: string;
};

export type AllReferences = {
  ids: number[];
  byId: {
    [key: number]: Reference;
  };
  byGroup: {
    [key: number]: number[];
  };
};

export type ReferenceGroup = {
  id: number;
  name: string;
  entities: number[];
  tags: string[];
  created_by: number;
  created_at: string;
};

export type AllReferenceGroups = {
  ids: number[];
  byId: {
    [key: number]: ReferenceGroup;
  };
  byEntity: {
    [key: number]: number[];
  };
  byTagName: {
    [key: string]: number[];
  };
};
