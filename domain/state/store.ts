// Zustand store for global app state

import { create } from 'zustand';
import type { AppState, TaskList, Task, ListId, TaskId } from '../types';
import { generateListId, generateTaskId } from '../utils/uuid';

interface StoreActions {
  // List operations
  createList: (name: string) => ListId;
  updateList: (listId: ListId, updates: Partial<TaskList>) => void;
  deleteList: (listId: ListId) => void;
  setActiveList: (listId: ListId | null) => void;

  // Task operations
  createTask: (listId: ListId, title: string, note?: string) => TaskId;
  updateTask: (listId: ListId, taskId: TaskId, updates: Partial<Task>) => void;
  deleteTask: (listId: ListId, taskId: TaskId) => void;
  toggleTaskDone: (listId: ListId, taskId: TaskId) => void;

  // Task order operations
  reorderTasks: (listId: ListId, taskOrder: TaskId[]) => void;

  // Hydration
  hydrate: (state: Partial<AppState>) => void;
  setHydrated: (hydrated: boolean) => void;

  // Reset
  reset: () => void;
}

type Store = AppState & StoreActions;

const initialState: AppState = {
  lists: {},
  activeListId: null,
  hydrated: false,
};

export const useStore = create<Store>((set, get) => ({
  ...initialState,

  // List operations
  createList: (name: string) => {
    const id = generateListId();
    const now = Date.now();

    const newList: TaskList = {
      id,
      name,
      taskOrder: [],
      tasks: {},
      sorting: null,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    set(state => ({
      lists: { ...state.lists, [id]: newList },
      activeListId: id,
    }));

    return id;
  },

  updateList: (listId: ListId, updates: Partial<TaskList>) => {
    set(state => {
      const list = state.lists[listId];
      if (!list) return state;

      return {
        lists: {
          ...state.lists,
          [listId]: {
            ...list,
            ...updates,
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  deleteList: (listId: ListId) => {
    set(state => {
      const { [listId]: deleted, ...remaining } = state.lists;
      return {
        lists: remaining,
        activeListId: state.activeListId === listId ? null : state.activeListId,
      };
    });
  },

  setActiveList: (listId: ListId | null) => {
    set({ activeListId: listId });
  },

  // Task operations
  createTask: (listId: ListId, title: string, note?: string) => {
    const taskId = generateTaskId();
    const now = Date.now();

    const newTask: Task = {
      id: taskId,
      title,
      note,
      done: false,
      createdAt: now,
      updatedAt: now,
    };

    set(state => {
      const list = state.lists[listId];
      if (!list) return state;

      return {
        lists: {
          ...state.lists,
          [listId]: {
            ...list,
            tasks: {
              ...list.tasks,
              [taskId]: newTask,
            },
            taskOrder: [...list.taskOrder, taskId],
            updatedAt: now,
          },
        },
      };
    });

    return taskId;
  },

  updateTask: (listId: ListId, taskId: TaskId, updates: Partial<Task>) => {
    set(state => {
      const list = state.lists[listId];
      if (!list || !list.tasks[taskId]) return state;

      return {
        lists: {
          ...state.lists,
          [listId]: {
            ...list,
            tasks: {
              ...list.tasks,
              [taskId]: {
                ...list.tasks[taskId],
                ...updates,
                updatedAt: Date.now(),
              },
            },
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  deleteTask: (listId: ListId, taskId: TaskId) => {
    set(state => {
      const list = state.lists[listId];
      if (!list) return state;

      const { [taskId]: deleted, ...remainingTasks } = list.tasks;
      const taskOrder = list.taskOrder.filter(id => id !== taskId);

      return {
        lists: {
          ...state.lists,
          [listId]: {
            ...list,
            tasks: remainingTasks,
            taskOrder,
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  toggleTaskDone: (listId: ListId, taskId: TaskId) => {
    set(state => {
      const list = state.lists[listId];
      const task = list?.tasks[taskId];
      if (!list || !task) return state;

      return {
        lists: {
          ...state.lists,
          [listId]: {
            ...list,
            tasks: {
              ...list.tasks,
              [taskId]: {
                ...task,
                done: !task.done,
                updatedAt: Date.now(),
              },
            },
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  // Task order operations
  reorderTasks: (listId: ListId, taskOrder: TaskId[]) => {
    set(state => {
      const list = state.lists[listId];
      if (!list) return state;

      return {
        lists: {
          ...state.lists,
          [listId]: {
            ...list,
            taskOrder,
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  // Hydration
  hydrate: (newState: Partial<AppState>) => {
    set(state => ({
      ...state,
      ...newState,
      hydrated: true,
    }));
  },

  setHydrated: (hydrated: boolean) => {
    set({ hydrated });
  },

  // Reset
  reset: () => {
    set(initialState);
  },
}));

// Selectors for common queries
export const selectActiveList = (state: Store) => {
  if (!state.activeListId) return null;
  return state.lists[state.activeListId] || null;
};

export const selectActiveTasks = (state: Store) => {
  const list = selectActiveList(state);
  if (!list) return [];

  return list.taskOrder
    .map(id => list.tasks[id])
    .filter(Boolean);
};

export const selectActiveTasksNotDone = (state: Store) => {
  return selectActiveTasks(state).filter(task => !task.done);
};

export const selectListById = (listId: ListId) => (state: Store) => {
  return state.lists[listId] || null;
};
