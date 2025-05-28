type MethodType = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'OPTIONS';

interface SuccessfulResponseType<ResponseBodyType> {
  success: boolean;
  statusCode: number;
  response: ResponseBodyType;
}

interface UnsuccessfulResponseType {
  success: boolean;
  statusCode: number;
  response: object;
}

type ResponseType<ResponseBodyType> =
  | SuccessfulResponseType<ResponseBodyType>
  | UnsuccessfulResponseType;

const isSuccessfulResponseType = <T>(x: any): x is SuccessfulResponseType<T> =>
  x.success === true;

const makeAuthorisedRequest = async <ResponseBodyType>(
  authToken: string,
  url: string,
  requestBody: object | null = null,
  method: MethodType = 'GET',
  extraHeaders: object = {}
): Promise<ResponseType<ResponseBodyType>> => {
  return fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      ...extraHeaders
    },
    body: requestBody ? JSON.stringify(requestBody) : null
  })
    .then((response) => {
      const getJsonObject = async () => {
        return {
          response:
            method === 'DELETE' ? { success: true } : await response.json(),
          success: response.ok,
          statusCode: response.status
        };
      };
      return getJsonObject();
    })
    .catch((error) => {
      return {
        success: false,
        statusCode: 0,
        response: { error }
      };
    });
};

export {
  MethodType,
  makeAuthorisedRequest,
  SuccessfulResponseType,
  UnsuccessfulResponseType,
  isSuccessfulResponseType
};
