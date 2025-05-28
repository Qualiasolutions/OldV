import { vuetApi } from './api';
import { Country, AllHolidays } from './types';

const extendedApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllCountries: builder.query<Country[], number>({
      query: () => ({
        url: 'core/holidays/countries/'
      }),
      providesTags: ['Country']
    }),
    getHolidays: builder.query<AllHolidays, string>({
      query: (body) => ({
        url: `core/holidays/country_holidays?${body}`
      })
    })
  }),
  overrideExisting: true
});

export const { useGetAllCountriesQuery, useGetHolidaysQuery } = extendedApi;
