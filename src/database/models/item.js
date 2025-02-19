import AppDataSource from "../database.js";
import item from "../entities/item.js";

export const upsertItem = async (listItem) => {
  const itemRepository = AppDataSource.getRepository(item);
  try {
    const items = listItem.map((item) => itemRepository.create(item));
    await itemRepository.upsert(items, {
      conflictPaths: ["item_id"],
      skipUpdateIfNoValuesChanged: true,
    });
    return true;
  } catch (error) {
    return false;
  }
};

export const randomItem = async () => {
  try {
    const itemRepository = AppDataSource.getRepository(item);
    const randomItem = await itemRepository
      .createQueryBuilder("item")
      .where("item.status = :status", { status: "in_stock" })
      .orderBy("RANDOM()") // SQLite hỗ trợ RANDOM()
      .limit(1)
      .getOne();

    return randomItem ? randomItem.item_id : null;
  } catch (error) {
    console.error("🚀 ~ randomItem ~ error:", error);
    return null;
  }
};

export const updateItem = async (itemId) => {
  const itemRepository = AppDataSource.getRepository(item);
  try {
    await itemRepository.update(
      { item_id: itemId },
      { status: "out_of_stock" }
    );
    return true;
  } catch (error) {
    return false;
  }
};

export const itemInStockCount = async () => {
  const itemRepository = AppDataSource.getRepository(item);
  const inStockCount = await itemRepository.count({ status: "in_stock" });
  return inStockCount;
};
