import _ from "lodash";
import AppDataSource from "../database.js";
import Task from "../entities/Task.js";
export const truncateTable = async (tableName) => {
  try {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.query(`DELETE FROM ${tableName};`);
    await queryRunner.release();

    console.log(`✅ All records in table '${tableName}' have been deleted.`);
    return true;
  } catch (error) {
    console.error(`❌ Error in truncateTable(${tableName}):`, error);
    return false;
  }
};
export const upsertTask = async (tasks) => {
  const taskRepository = AppDataSource.getRepository(Task);
  try {
    const listTasks = _.map(tasks, (task) => taskRepository.create(task));
    await taskRepository.upsert(listTasks, {
      conflictPaths: ["task_id"],
      skipUpdateIfNoValuesChanged: true,
    });
    return true;
  } catch (error) {
    console.error("Error in upsertTask:", error);
    return false;
  }
};

export const createTask = async ({ port, position, resolution }) => {
  const taskRepository = AppDataSource.getRepository(Task);
  try {
    const newTask = taskRepository.create({ port, position, resolution });
    await taskRepository.save(newTask);
    console.log("Task created:", newTask);
    return newTask;
  } catch (error) {
    console.error("Error in createTask:", error);
    throw error;
  }
};

export const updateTask = async (id, { port }) => {
  const taskRepository = AppDataSource.getRepository(Task);
  try {
    const task = await taskRepository.findOneBy({ id });
    if (!task) return null;
    task.port = port ?? task.port;
    await taskRepository.save(task);
    console.log("Task updated:", task);
    return task;
  } catch (error) {
    console.error("Error in updateTask:", error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId) => {
  console.log("🚀 ~ updateTaskStatus ~ taskId:", taskId);
  const taskRepository = AppDataSource.getRepository(Task);
  try {
    const task = await taskRepository.findOneBy({
      task_id: taskId,
    });
    if (!task) {
      return false;
    }
    task.status = "available";
    await taskRepository.save(task);
    console.log(
      `✅ Task ID ${task.id} tại vị trí (${task.position.x}, ${task.position.y}) đã được cập nhật thành 'available'.`
    );
    return true;
  } catch (error) {
    console.error("❌ Error in updateTaskStatus:", error);
    return false;
  }
};

let allPorts = _.shuffle(_.range(40000, 40050));

export const readRandomTask = async () => {
  const taskRepository = AppDataSource.getRepository(Task);
  try {
    const task = await taskRepository.findOne({
      where: { status: "available" },
      order: {
        task_id: "ASC",
      },
    });
    if (!task) return null;
    const usedPorts = await taskRepository
      .createQueryBuilder("task")
      .select("task.port")
      .where("task.port IS NOT NULL")
      .getRawMany();
    const usedPortSet = new Set(usedPorts.map((t) => t.task_port));
    const availablePort = _.find(allPorts, (port) => !usedPortSet.has(port));
    if (!availablePort) {
      console.error("❌ No available ports left!");
      return null;
    }
    task.status = "not_available";
    task.port = availablePort;
    await taskRepository.save(task);
    return task;
  } catch (error) {
    console.log("🚀 ~ readRandomTask ~ error:", error);
    return null;
  }
};
export const readTask = async (workerId) => {
  const taskRepository = AppDataSource.getRepository(Task);
  try {
    const task = await taskRepository.findOne({
      where: { status: "available", task_id: workerId },
      order: {
        task_id: "ASC",
      },
    });
    if (!task) return null;
    const usedPorts = await taskRepository
      .createQueryBuilder("task")
      .select("task.port")
      .where("task.port IS NOT NULL")
      .getRawMany();
    const usedPortSet = new Set(usedPorts.map((t) => t.task_port));
    const availablePort = _.find(allPorts, (port) => !usedPortSet.has(port));
    if (!availablePort) {
      console.error("❌ No available ports left!");
      return null;
    }
    task.status = "not_available";
    task.port = availablePort;
    await taskRepository.save(task);
    return task;
  } catch (error) {
    console.log("🚀 ~ readRandomTask ~ error:", error);
    return null;
  }
};

export const removeTask = async (id) => {
  const taskRepository = AppDataSource.getRepository(Task);
  try {
    const task = await taskRepository.findOneBy({ id });
    if (!task) return null;
    await taskRepository.remove(task);
    console.log(`Task ID ${id} removed`);
    return { message: "Task removed successfully" };
  } catch (error) {
    console.error("Error in removeTask:", error);
    throw error;
  }
};

export const readTasks = async () => {
  const taskRepository = AppDataSource.getRepository(Task);
  try {
    const tasks = await taskRepository.find();
    console.log("Tasks retrieved:", tasks);
    return tasks;
  } catch (error) {
    console.error("Error in readTasks:", error);
    throw error;
  }
};

export const getTaskByPosition = async (taskId) => {
  const taskRepository = AppDataSource.getRepository(Task);
  try {
    const task = await taskRepository.findOne({ where: { task_id: taskId } });
    return task;
  } catch (error) {
    console.error("Error in getTaskByPosition:", error);
    return null;
  }
};

export const checkTaskAvaliable = async (taskId) => {
  const taskRepository = AppDataSource.getRepository(Task);
  try {
    await taskRepository.findOneOrFail({
      where: { status: "available", task_id: taskId },
    });
    return true;
  } catch (error) {
    console.error("Error in checkTasksAvaliable:", error);
  }
  return false;
};
