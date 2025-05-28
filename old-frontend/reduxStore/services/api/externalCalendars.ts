import {
  ICalIntegration,
  ICalIntegrationCreateRequest,
  ICalIntegrationUpdateRequest
} from 'types/externalCalendars';
import { normalizeData, vuetApi } from './api';

const externalCalendarsApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    getICalIntegrations: builder.query<
      { ids: number[]; byId: { [key: number]: ICalIntegration } },
      void
    >({
      query: () => ({
        url: 'external-calendars/ical-integration/',
        method: 'GET',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: ICalIntegration[] = await response.json();
            return normalizeData(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['ICalIntegration']
    }),
    createICalIntegration: builder.mutation<
      ICalIntegration,
      ICalIntegrationCreateRequest
    >({
      query: (body) => ({
        url: 'external-calendars/ical-integration/',
        method: 'POST',
        body: body
      }),
      invalidatesTags: ['ICalIntegration', 'Task']
    }),
    deleteICalIntegration: builder.mutation<void, number>({
      query: (integrationId) => ({
        url: `external-calendars/ical-integration/${integrationId}/`,
        method: 'DELETE'
      }),
      invalidatesTags: ['ICalIntegration', 'Task']
    }),
    updateICalIntegration: builder.mutation<
      ICalIntegration,
      ICalIntegrationUpdateRequest
    >({
      query: (body) => ({
        url: `external-calendars/ical-integration/${body.id}/`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['ICalIntegration']
    })
  }),
  overrideExisting: true
});

export default externalCalendarsApi;

export const {
  useGetICalIntegrationsQuery,
  useCreateICalIntegrationMutation,
  useDeleteICalIntegrationMutation,
  useUpdateICalIntegrationMutation
} = externalCalendarsApi;
