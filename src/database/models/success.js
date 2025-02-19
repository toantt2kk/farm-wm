import _ from "lodash";
import AppDataSource from "../database.js";
import success from "../entities/success.js";

export const upsertSuccesses = async (successList) => {
  if (!Array.isArray(successList) || successList.length === 0) {
    throw new Error("Invalid input: successList must be a non-empty array");
  }

  const successRepository = AppDataSource.getRepository(success);

  try {
    const list = _.map(successList, (success) => {
      return successRepository.create(success);
    });
    const result = await successRepository.upsert(list, {
      conflictPaths: ["email"],
      skipUpdateIfNoValuesChanged: true,
    });

    console.log(`Upserted ${successList.length} Success records successfully.`);
    return result;
  } catch (error) {
    console.error("Error in upsertSuccesses:", error);
    throw error;
  }
};
