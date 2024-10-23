import { db } from "./prisma.server";

export const getRecipes = () => {
  return db.recipes.findMany({
    include: {
      ingredients: true,
      _count: true,
      user: true,
    },
  });
};

export const getMyRecipes = (userId: string) => {
  return db.recipes.findMany({
    where: {
      userId,
    },
    include: {
      // ingredients: true,
      // steps: true,
      _count: true,
    },
  });
};

export const getPublicRecipes = (userId: string) => {
  return db.recipes.findMany({
    where: {
      userId: {
        not: userId,
      },
    },
    include: {
      ingredients: true,

      _count: true,
    },
  });
};

export const getRecipe = (id: string) => {
  return db.recipes.findUnique({
    where: {
      id,
    },
    include: {
      ingredients: true,
      user: true,
      steps: true,
      _count: true,
    },
  });
};
