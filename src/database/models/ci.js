import _ from "lodash";
import AppDataSource from "../database.js";
import ci from "../entities/ci.js";

const validStatuses = ["used", "error", "unused"];

export const upsertCIs = async (ciList) => {
  const ciRepository = AppDataSource.getRepository(ci);
  if (!Array.isArray(ciList) || ciList.length === 0)
    throw new Error("Invalid input");

  try {
    const clist = _.map(ciList, (cc) => {
      const newCI = ciRepository.create(cc);
      return newCI;
    });
    const packData = _.chunk(clist, 500);
    await Promise.all(
      _.map(packData, async (chunks) => {
        await ciRepository.upsert(chunks, {
          conflictPaths: ["cc_number"],
          skipUpdateIfNoValuesChanged: true,
        });
      })
    );

    console.log(`Upserted ${ciList.length} CI records.`);
    return true;
  } catch (error) {
    console.log("🚀 ~ upsertCIs ~ error:", error);
    return false;
  }
};

export const readRandomUnusedCI = async () => {
  const ciRepository = AppDataSource.getRepository(ci);

  try {
    const randomCI = await ciRepository
      .createQueryBuilder("ci")
      .where("ci.status = :status", { status: "unused" })
      .orderBy("RANDOM()")
      .limit(1)
      .getOne();

    if (!randomCI) {
      throw new Error("No unused CI found in the database.");
    }

    console.log("Random unused CI retrieved:", randomCI);
    return randomCI;
  } catch (error) {
    console.error("Error in readRandomUnusedCI:", error);
    throw error;
  }
};

export const updateCi = async (ciId, updatedStatus) => {
  const ciRepository = AppDataSource.getRepository(ci);
  try {
    if (!validStatuses.includes(updatedStatus)) {
      throw new Error(
        `Invalid status value: ${updatedStatus}. Must be "used", "error", or "unused".`
      );
    }

    const ci = await ciRepository.findOneBy({ id: ciId });

    if (!ci) {
      throw new Error(`CI with ID ${ciId} not found.`);
    }

    ci.status = updatedStatus;
    await ciRepository.save(ci);
    return ci;
  } catch (error) {
    return null;
  }
};

export const counterCiUnused = async () => {
  try {
    const db = AppDataSource.getRepository(ci);
    const count = await db.count({
      where: { status: "unused" },
    });
    return count;
  } catch (error) {
    console.error("🚀 ~ counterCiUnused ~ error:", error);
    return 0;
  }
};
