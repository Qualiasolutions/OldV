import { createSelector } from '@reduxjs/toolkit';
import categoriesApi from 'reduxStore/services/api/categories';

export const selectCategoryById = (categoryId: number) =>
  createSelector(
    categoriesApi.endpoints.getAllCategories.select(),
    (categories) => {
      const categoryData = categories?.data;
      if (!categoryData) {
        return null;
      }
      return categoryData.byId[categoryId];
    }
  );

export const selectProfessionalCategoryById = (categoryId: number) =>
  createSelector(
    categoriesApi.endpoints.getAllProfessionalCategories.select(),
    (categories) => {
      const categoryData = categories?.data;
      if (!categoryData) {
        return null;
      }
      return categoryData.byId[categoryId];
    }
  );
